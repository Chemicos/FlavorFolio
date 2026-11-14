const DEFINITIVE_ERROR_CODES = new Set([
    "functions/invalid-argument",
    "functions/unauthenticated",
    "functions/permission-denied",
    "functions/not-found",
    "functions/failed-precondition",
    "functions/resource-exhausted",
    "storage/unauthorized",
    "storage/invalid-argument",
    "storage/invalid-format",
])

export function getFirebaseErrorCode(error: unknown): string | null {
    if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "string") {
        return error.code
    }

    return null
}

export function isDefinitiveOperationError(error: unknown): boolean {
    const code = getFirebaseErrorCode(error)
    return code !== null && DEFINITIVE_ERROR_CODES.has(code)
}