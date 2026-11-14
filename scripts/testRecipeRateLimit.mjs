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

const app = initializeApp({
  apiKey: "demo-key",
  projectId: "flavorfolio-eaecb",
  appId: "demo-app",
})

const auth = getAuth(app)

connectAuthEmulator(
  auth,
  "http://127.0.0.1:9099",
  { disableWarnings: true }
)

const functions = getFunctions(app, "europe-west1")

connectFunctionsEmulator(
  functions,
  "127.0.0.1",
  5001
)

// Introdu doar datele contului fictiv creat în emulator.
const email = "tester@flavorfolio.test"
const password = "tester"

await signInWithEmailAndPassword(auth, email, password)

console.log("Authenticated as:", auth.currentUser?.uid)

const beginRecipeCreation = httpsCallable(
  functions,
  "beginRecipeCreation"
)

let firstRequestId = null

for (let index = 1; index <= 4; index++) {
  const requestId = randomUUID()

  if (index === 1) {
    firstRequestId = requestId
  }

  try {
    const response = await beginRecipeCreation({ requestId })

    console.log(`Request ${index}: ACCEPTED`, response.data)
  } catch (error) {
    console.log(
      `Request ${index}: REJECTED`,
      error.code,
      error.message
    )
  }
}

// Retry the first request to verify idempotency.
if (firstRequestId) {
  const retry = await beginRecipeCreation({
    requestId: firstRequestId,
  })

  console.log("Idempotent retry:", retry.data)
}

process.exit(0)