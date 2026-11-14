import { randomUUID } from "node:crypto"

import { initializeApp } from "firebase/app"

import {
  getAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
} from "firebase/auth"

import {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable,
} from "firebase/functions"

import {
  getStorage,
  connectStorageEmulator,
  ref,
  uploadBytes,
} from "firebase/storage"

// Firebase local configuration
const app = initializeApp({
  apiKey: "demo-key",
  projectId: "flavorfolio-eaecb",
  appId: "demo-app",

  // Folosește același bucket din VITE_FIREBASE_STORAGE_BUCKET
  storageBucket: "flavorfolio-eaecb.appspot.com",
})

// Authentication
const auth = getAuth(app)

connectAuthEmulator(
  auth,
  "http://127.0.0.1:9099",
  { disableWarnings: true }
)

// Cloud Functions
const functions = getFunctions(app, "europe-west1")

connectFunctionsEmulator(
  functions,
  "127.0.0.1",
  5001
)

// Firebase Storage
const storage = getStorage(app)

connectStorageEmulator(
  storage,
  "127.0.0.1",
  9199
)

// Folosește contul fictiv din Authentication Emulator
const email = "tester@flavorfolio.test"
const password = "tester"

const beginRecipeCreation = httpsCallable(
  functions,
  "beginRecipeCreation"
)

const finalizeRecipeCreation = httpsCallable(
  functions,
  "finalizeRecipeCreation"
)

// A valid, minimal PNG image
const pngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII="

async function main() {
  // 1. Authenticate
  const credentials = await signInWithEmailAndPassword(
    auth,
    email,
    password
  )

  console.log("Authenticated as:", credentials.user.uid)

  // 2. Create a unique request
  const requestId = randomUUID()

  console.log("\n1. Reserving recipe creation...")

  const reservationResponse = await beginRecipeCreation({
    requestId,
  })

  const reservation = reservationResponse.data

  console.log("Reservation:", reservation)

  // 3. Upload test image
  const imagePath = `${reservation.uploadPrefix}main/test-image.png`

  console.log("\n2. Uploading image...")
  console.log("Storage path:", imagePath)

  const imageBytes = Uint8Array.from(
    Buffer.from(pngBase64, "base64")
  )

  const imageReference = ref(storage, imagePath)

  await uploadBytes(imageReference, imageBytes, {
    contentType: "image/png",
  })

  console.log("Image uploaded successfully.")

  // 4. Prepare recipe data
  const recipe = {
    title: "Firebase Emulator Test Recipe",

    description:
      "This is a test recipe created to validate the Firebase Cloud Functions rate limiting implementation.",

    cuisine: "romanian",

    durationMinutes: 30,
    servings: 2,
    difficulty: "easy",
    meal: "lunch",
    visibility: "public",

    imagePath,

    ingredients: [
      {
        ingredient: "Potatoes",
        quantity: "500",
        unit: "g",
      },
      {
        ingredient: "Salt",
        quantity: "5",
        unit: "g",
      },
    ],

    steps: [
      {
        title: "Prepare ingredients",
        description:
          "Wash and prepare all the ingredients.",
        imagePath: null,
      },
      {
        title: "Cook",
        description:
          "Cook the ingredients until they are ready.",
        imagePath: null,
      },
    ],
  }

  // 5. Finalize recipe
  console.log("\n3. Finalizing recipe...")

  const finalizePayload = {
    requestId,
    day: reservation.day,
    recipe,
  }

  const result = await finalizeRecipeCreation(finalizePayload)

  console.log("Finalization result:", result.data)

  // 6. Idempotency test
  console.log("\n4. Retrying the same finalization...")

  const retryResult = await finalizeRecipeCreation(
    finalizePayload
  )

  console.log("Retry result:", retryResult.data)

  console.log("\nTest completed.")
  console.log("Expected recipe ID:", requestId)
}

main()
  .catch((error) => {
    console.error("\nTest failed.")
    console.error("Code:", error.code)
    console.error("Message:", error.message)
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await auth.signOut()
  })