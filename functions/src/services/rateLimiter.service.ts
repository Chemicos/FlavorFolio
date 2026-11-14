import { DAILY_LIMITS, RateLimitAction } from "../config/dailyLimits";
import { type Transaction, getFirestore } from "firebase-admin/firestore";

const DEFAULT_RESERVATION_MINUTES = 15

export type RateLimitReservation = {
  action: RateLimitAction
  expiresAt: number
}

export type CompletedAction = {
  action: RateLimitAction
  completedAt: number
}

type DailyRateLimitDocument = {
  counts: Partial<Record<RateLimitAction, number>>
  reservations: Record<string, RateLimitReservation>
  completed: Record<string, CompletedAction>
}

export type ReservationResult = {
  requestId: string
  action: RateLimitAction
  day: string
  limit: number
  used: number
  remaining: number
  expiresAt: number
}

export class RateLimitError extends Error {
  constructor(
    public readonly code:
      | "limit-exceeded"
      | "reservation-expired"
      | "reservation-not-found"
      | "invalid-request",
    message: string
  ) {
    super(message)
    this.name = "RateLimitError"
  }
}

// Calendar day in UTC: YYYY-MM-DD
function getUtcDay(now: number): string {
  return new Date(now).toISOString().slice(0, 10)
}

function getDayReference(userId: string, day: string) {
  return getFirestore()
    .collection("rateLimits")
    .doc(userId)
    .collection("days")
    .doc(day)
}

function validateIdentifiers(
  userId: string,
  requestId: string
) {
  if (!userId || userId.includes("/")) {
    throw new RateLimitError(
      "invalid-request",
      "Invalid user ID."
    )
  }

  // Works with crypto.randomUUID()
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(requestId)) {
    throw new RateLimitError(
      "invalid-request",
      "Invalid request ID."
    )
  }
}

function validateDay(day: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
    getUtcDay(Date.parse(`${day}T00:00:00.000Z`)) !== day
  ) {
    throw new RateLimitError(
      "invalid-request",
      "Invalid UTC day."
    )
  }
}

function normalizeDocument(
  data?: Partial<DailyRateLimitDocument>
): DailyRateLimitDocument {
  return {
    counts: { ...(data?.counts ?? {}) },
    reservations: { ...(data?.reservations ?? {}) },
    completed: { ...(data?.completed ?? {}) },
  }
}

function removeExpiredReservations(
  data: DailyRateLimitDocument,
  now: number
) {
  for (const [requestId, reservation] of Object.entries(
    data.reservations
  )) {
    if (reservation.expiresAt <= now) {
      delete data.reservations[requestId]
    }
  }
}

function countActiveReservations(
  data: DailyRateLimitDocument,
  action: RateLimitAction
): number {
  return Object.values(data.reservations).filter(
    (reservation) => reservation.action === action
  ).length
}

function getUsage(
  data: DailyRateLimitDocument,
  action: RateLimitAction
) {
  const limit = DAILY_LIMITS[action]
  const completed = data.counts[action] ?? 0
  const active = countActiveReservations(data, action)

  return {
    limit,
    completed,
    active,
    used: completed + active,
  }
}

/**
 * Reserves one action from a user's daily allowance.
 *
 * Must be called from trusted server code using
 * the authenticated user's UID.
 */
export async function reserveDailyAction({
  userId,
  action,
  requestId,
  reservationMinutes = DEFAULT_RESERVATION_MINUTES,
  performWrites,
}: {
  userId: string
  action: RateLimitAction
  requestId: string
  reservationMinutes?: number
  performWrites?: (
    transaction: Transaction,
    reservation: ReservationResult
  ) => void
}): Promise<ReservationResult> {
  validateIdentifiers(userId, requestId)

  if (
    !Number.isFinite(reservationMinutes) ||
    reservationMinutes <= 0 ||
    reservationMinutes > 60
  ) {
    throw new RateLimitError(
      "invalid-request",
      "Invalid reservation duration."
    )
  }

  const now = Date.now()
  const day = getUtcDay(now)
  const dayRef = getDayReference(userId, day)

  return getFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(dayRef)

    const data = normalizeDocument(
      snapshot.data() as DailyRateLimitDocument | undefined
    )

    removeExpiredReservations(data, now)

    const completedAction = data.completed[requestId]

    if (completedAction) {
      throw new RateLimitError(
        "invalid-request",
        "This request has already been completed."
      )
    }

    const existingReservation =
      data.reservations[requestId]

    // Repeated request: return the original reservation.
    if (existingReservation) {
      if (existingReservation.action !== action) {
        throw new RateLimitError(
          "invalid-request",
          "Request ID belongs to another action."
        )
      }

      const usage = getUsage(data, action)

      return {
        requestId,
        action,
        day,
        limit: usage.limit,
        used: usage.used,
        remaining: Math.max(0, usage.limit - usage.used),
        expiresAt: existingReservation.expiresAt,
      }
    }

    const usage = getUsage(data, action)

    if (usage.used >= usage.limit) {
      throw new RateLimitError(
        "limit-exceeded",
        `Daily limit reached (${usage.limit}). Try again tomorrow.`
      )
    }

    const expiresAt =
      now + reservationMinutes * 60 * 1000

    data.reservations[requestId] = {
      action,
      expiresAt,
    }

    const result: ReservationResult = {
      requestId,
      action,
      day,
      limit: usage.limit,
      used: usage.used + 1,
      remaining: Math.max(
        0,
        usage.limit - usage.used - 1
      ),
      expiresAt,
    }

    performWrites?.(transaction, result)

    transaction.set(dayRef, data)

    return result
  })
}

/**
 * Confirms a reserved action.
 *
 * The caller can supply Firestore writes that must be
 * committed atomically with the rate-limit counter.
 */
export async function finalizeDailyAction({
  userId,
  action,
  requestId,
  day,
  validateBeforeWrites,
  performWrites,
}: {
  userId: string
  action: RateLimitAction
  requestId: string
  day: string
  validateBeforeWrites?: (transaction: Transaction) => Promise<void>
  performWrites: (transaction: Transaction) => void
}): Promise<boolean> {
  validateIdentifiers(userId, requestId)
  validateDay(day)

  const now = Date.now()
  const dayRef = getDayReference(userId, day)

  return getFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(dayRef)

    if (!snapshot.exists) {
      throw new RateLimitError(
        "reservation-not-found",
        "No reservation exists for this request."
      )
    }

    const data = normalizeDocument(
      snapshot.data() as DailyRateLimitDocument
    )

    const completedAction = data.completed[requestId]

    // Idempotent retry: do not execute writes again.
    if (completedAction) {
      if (completedAction.action !== action) {
        throw new RateLimitError(
          "invalid-request",
          "Request ID belongs to another action."
        )
      }

      return false
    }

    const reservation = data.reservations[requestId]

    if (!reservation) {
      throw new RateLimitError(
        "reservation-not-found",
        "Reservation not found."
      )
    }

    if (reservation.action !== action) {
      throw new RateLimitError(
        "invalid-request",
        "Reservation belongs to another action."
      )
    }

    if (reservation.expiresAt <= now) {
      throw new RateLimitError(
        "reservation-expired",
        "Reservation has expired."
      )
    }

    if (validateBeforeWrites) {
      await validateBeforeWrites(transaction)
    }

    delete data.reservations[requestId]

    data.counts[action] =
      (data.counts[action] ?? 0) + 1

    data.completed[requestId] = {
      action,
      completedAt: now,
    }

    // All application reads must happen before this point.
    // Only transaction writes should be performed here.
    performWrites(transaction)

    transaction.set(dayRef, data)

    return true
  })
}

/**
 * Releases a reservation that was not completed.
 */
export async function cancelDailyAction({
  userId,
  action,
  requestId,
  day,
  performWrites,
}: {
  userId: string
  action: RateLimitAction
  requestId: string
  day: string
  performWrites?: (transaction: Transaction) => void
}): Promise<void> {
  validateIdentifiers(userId, requestId)
  validateDay(day)

  const dayRef = getDayReference(userId, day)

  await getFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(dayRef)

    if (!snapshot.exists) return

    const data = normalizeDocument(
      snapshot.data() as DailyRateLimitDocument
    )

    const reservation = data.reservations[requestId]

    if (!reservation) return

    if (reservation.action !== action) {
      throw new RateLimitError(
        "invalid-request",
        "Reservation belongs to another action."
      )
    }

    delete data.reservations[requestId]

    performWrites?.(transaction)

    transaction.set(dayRef, data)
  })
}