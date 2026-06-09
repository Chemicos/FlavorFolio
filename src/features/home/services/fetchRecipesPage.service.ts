import { collection, DocumentSnapshot, getDocs, limit, orderBy, query, startAfter, where } from "@firebase/firestore";
import { db } from "../../../firebase-config";
import { Recipe } from "../types";

const PAGE_SIZE = 20

export async function fetchRecipesPage(lastDoc?: DocumentSnapshot) {
    const baseConstraints = [
        where("status", "==", "approved"),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE),
    ]

    const q = lastDoc
    ? query(
        collection(db, "recipes"),
        ...baseConstraints,
        startAfter(lastDoc)
      )
    : query(collection(db, "recipes"), ...baseConstraints)

  const snapshot = await getDocs(q)

  return {
    recipes: snapshot.docs.map((doc) => ({
      recipeId: doc.id,
      ...doc.data(),
    })) as Recipe[],
    lastDoc: snapshot.docs[snapshot.docs.length - 1] ?? null,
    hasMore: snapshot.docs.length === PAGE_SIZE,
  }
}