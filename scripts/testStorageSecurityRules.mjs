import { randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"

import {
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing"

import {
  doc,
  setDoc,
} from "firebase/firestore"

import {
  ref,
  uploadBytes,
  deleteObject,
  getMetadata,
  listAll,
} from "firebase/storage"

const PROJECT_ID = "flavorfolio-eaecb"
const BUCKET = "flavorfolio-eaecb.appspot.com"

const FIRESTORE_HOST = "127.0.0.1"
const FIRESTORE_PORT = 8080

const STORAGE_HOST = "127.0.0.1"
const STORAGE_PORT = 9199

const PNG_DATA = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=",
  "base64"
)

const PNG_METADATA = {
  contentType: "image/png",
}

const PDF_METADATA = {
  contentType: "application/pdf",
}

const results = {
  passed: 0,
  failed: 0,
}

function createRequestId() {
  return randomUUID()
}

async function expectAllowed(name, operation) {
  try {
    await operation()

    results.passed++

    console.log(`PASS: ${name} - ACCEPTED`)
  } catch (error) {
    results.failed++

    console.error(`FAIL: ${name}`)
    console.error("Expected ACCEPTED, received:", error.code || error)
  }
}

async function expectDenied(name, operation) {
  try {
    await operation()

    results.failed++

    console.error(`FAIL: ${name}`)
    console.error("Expected REJECTED, but operation succeeded.")
  } catch (error) {
    if (
      error?.code === "storage/unauthorized" ||
      error?.code === "storage/permission-denied"
    ) {
      results.passed++

      console.log(`PASS: ${name} - REJECTED`)
    } else {
      results.failed++

      console.error(`FAIL: ${name}`)
      console.error(
        "Expected a Security Rules rejection, received:",
        error?.code || error
      )
    }
  }
}

async function main() {
  const testEnvironment = await initializeTestEnvironment({
    projectId: PROJECT_ID,

    firestore: {
      host: FIRESTORE_HOST,
      port: FIRESTORE_PORT,
    },

    storage: {
      host: STORAGE_HOST,
      port: STORAGE_PORT,
      rules: readFileSync("storage.rules", "utf8"),
    },
  })

  try {
    const suffix = randomUUID().slice(0, 8)

    const ownerId = `storage-owner-${suffix}`
    const otherUserId = `storage-other-${suffix}`

    const owner = testEnvironment.authenticatedContext(ownerId)
    const otherUser = testEnvironment.authenticatedContext(otherUserId)
    const guest = testEnvironment.unauthenticatedContext()

    const ownerStorage = owner.storage(BUCKET)
    const otherStorage = otherUser.storage(BUCKET)
    const guestStorage = guest.storage(BUCKET)

    const seedSession = async ({
    requestId = createRequestId(),
    status = "active",
    expiresAt = Date.now() + 15 * 60 * 1000,
    } = {}) => {
      await testEnvironment.withSecurityRulesDisabled(
        async (context) => {
          await setDoc(
            doc(
              context.firestore(),
              "recipeUploadSessions",
              requestId
            ),
            {
              userId: ownerId,
              requestId,
              day: new Date().toISOString().slice(0, 10),
              uploadPrefix:
                `recipe_uploads/${ownerId}/${requestId}/`,
              status,
              createdAt: Date.now(),
              expiresAt,
              completedAt: null,
              cancelledAt: null,
            }
          )
        }
      )

      return requestId
    }

    const mainImagePath = (
        requestId,
        fileName = "image.png"
    ) => {
        return `recipe_uploads/${ownerId}/${requestId}/main/${fileName}`
    }


    const stepImagePath = (
        requestId,
        index,
        fileName = "step.png"
    ) => {
        return `recipe_uploads/${ownerId}/${requestId}/steps/${index}/${fileName}`
    }

    const uploadAs = async (
        storage,
        path,
        data = PNG_DATA,
        metadata = PNG_METADATA
    ) => {
        return uploadBytes(ref(storage, path), data, metadata)
    }

    console.log("\n=== STORAGE SECURITY RULES TESTS ===\n")
    console.log("Project:", PROJECT_ID)
    console.log("Bucket:", BUCKET)
    console.log("Owner:", ownerId)
    console.log("Other user:", otherUserId)
    console.log("")

    // TEST 1: Valid upload
    const validRequestId = await seedSession()
    const validPath = mainImagePath(validRequestId)

    await expectAllowed(
      "1. Valid PNG upload with active session",
      () => uploadAs(ownerStorage, validPath)
    )

    // TEST 2: Other user
    const otherRequestId = await seedSession()

    await expectDenied(
      "2. Upload by another user",
      () => uploadAs(
        otherStorage,
        mainImagePath(otherRequestId)
      )
    )

    // TEST 3: Expired session
    const expiredRequestId = await seedSession({
      expiresAt: Date.now() - 60 * 1000,
    })

    await expectDenied(
      "3. Expired upload session",
      () => uploadAs(
        ownerStorage,
        mainImagePath(expiredRequestId)
      )
    )

    // TEST 4: Completed session
    const completedRequestId = await seedSession({
      status: "completed",
    })

    await expectDenied(
      "4. Completed upload session",
      () => uploadAs(
        ownerStorage,
        mainImagePath(completedRequestId)
      )
    )

    // TEST 5: Cleaned session
    const cleanedRequestId = await seedSession({
      status: "cleaned",
    })

    await expectDenied(
      "5. Cleaned upload session",
      () => uploadAs(
        ownerStorage,
        mainImagePath(cleanedRequestId)
      )
    )

    // TEST 6: Image larger than 10 MB
    const largeRequestId = await seedSession()
    const largeImage = Buffer.alloc(
      10 * 1024 * 1024 + 1,
      1
    )

    await expectDenied(
      "6. Image larger than 10 MB",
      () => uploadAs(
        ownerStorage,
        mainImagePath(largeRequestId),
        largeImage
      )
    )

    // TEST 7: Invalid MIME type
    const pdfRequestId = await seedSession()

    await expectDenied(
      "7. PDF upload",
      () => uploadAs(
        ownerStorage,
        mainImagePath(pdfRequestId, "document.pdf"),
        Buffer.from("%PDF-1.4\nTest document"),
        PDF_METADATA
      )
    )

    // TEST 8: Overwrite existing image
    await expectDenied(
      "8. Overwrite existing image",
      () => uploadAs(
        ownerStorage,
        validPath,
        Buffer.from(PNG_DATA)
      )
    )

    // TEST 9: Client deletes existing image
    await expectDenied(
      "9. Delete existing image",
      () => deleteObject(
        ref(ownerStorage, validPath)
      )
    )

    // TEST 10: List directory
    await expectDenied(
      "10. List recipe upload directory",
      () => listAll(
        ref(
          ownerStorage,
          `recipe_uploads/${ownerId}/${validRequestId}/main`
        )
      )
    )

    // TEST 11: Invalid step index
    const stepRequestId = await seedSession()

    await expectDenied(
      "11. Step index outside 0-29",
      () => uploadAs(
        ownerStorage,
        stepImagePath(stepRequestId, 30)
      )
    )

    // TEST 12: Missing session
    const missingRequestId = createRequestId()

    await expectDenied(
      "12. Upload without session",
      () => uploadAs(
        ownerStorage,
        mainImagePath(missingRequestId)
      )
    )

    // TEST 13: Unauthenticated user
    const guestRequestId = await seedSession()

    await expectDenied(
      "13. Unauthenticated upload",
      () => uploadAs(
        guestStorage,
        mainImagePath(guestRequestId)
      )
    )

    // TEST 14: Authenticated read
    await expectAllowed(
      "14. Read metadata of existing image",
      () => getMetadata(
        ref(ownerStorage, validPath)
      )
    )

    // Additional positive test: step image
    const validStepRequestId = await seedSession()

    await expectAllowed(
      "15. Valid cooking step image",
      () => uploadAs(
        ownerStorage,
        stepImagePath(validStepRequestId, 0)
      )
    )

    console.log("\n=== TEST RESULTS ===")
    console.log("Passed:", results.passed)
    console.log("Failed:", results.failed)
    console.log("Total:", results.passed + results.failed)

    if (results.failed > 0) {
      process.exitCode = 1
      console.error("\nSTORAGE SECURITY RULES TESTS FAILED.")
    } else {
      console.log("\nALL STORAGE SECURITY RULES TESTS PASSED.")
    }
  } finally {
    await testEnvironment.cleanup()
  }
}

main().catch((error) => {
  console.error("\nTEST RUNNER FAILED:", error)
  process.exitCode = 1
})