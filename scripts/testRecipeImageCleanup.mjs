import { createRequire } from "node:module"
import { resolve } from "node:path"

process.env.GCLOUD_PROJECT = "flavorfolio-eaecb"
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080"
process.env.FIREBASE_STORAGE_EMULATOR_HOST = "127.0.0.1:9199"

const requireFunctions = createRequire(
  resolve("functions/package.json")
)

const { initializeApp, getApps } = requireFunctions(
  "firebase-admin/app"
)

if (!getApps().length) {
  initializeApp({
    projectId: "flavorfolio-eaecb",
    storageBucket: "flavorfolio-eaecb.appspot.com",
  })
}

const { runRecipeImageCleanupCheck } = requireFunctions(
  "./lib/recipes/recipeImageCleanup.function.js"
)

try {
  const results = await runRecipeImageCleanupCheck()

  console.log("Cleanup verification results:", results)
} catch (error) {
  console.error("Cleanup verification failed:", error)
  process.exitCode = 1
} finally {
  const { getFirestore } = requireFunctions(
    "firebase-admin/firestore"
  )

  await getFirestore().terminate()
}