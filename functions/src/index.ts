/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { getApps, initializeApp } from "firebase-admin/app";
import {setGlobalOptions} from "firebase-functions";
// import {onRequest} from "firebase-functions/https";
// import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript
if (getApps().length === 0) {
    initializeApp()
}

export {
  beginRecipeCreation,
  finalizeRecipeCreation,
} from "./recipes/createRecipe.function"
export {
  submitRecipeRevision,
} from "./recipes/submitRecipeRevision.function"
export {
  beginRecipeEdit,
  finalizeRecipeEdit,
} from "./recipes/editRecipe.function"
export {
  queueReplacedRecipeImages,
  processRecipeImageCleanupJobs,
} from "./recipes/recipeImageCleanup.function"
export {
  setRecipeSaved,
} from "./recipes/setRecipeSaved.function"
export {
  rateRecipe,
} from "./recipes/rateRecipe.function"
export {
  cleanupAbandonedRecipeUploads,
} from "./recipes/cleanupAbandonedRecipeUploads.function";
setGlobalOptions({maxInstances: 10});
