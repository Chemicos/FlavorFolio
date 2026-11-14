import { getDownloadURL, ref } from "firebase/storage"
import { storage } from "../firebase-config"

const imageUrlCache = new Map<string,  Promise<string>>()

export async function resolveStorageImage(image: string | null | undefined): Promise<string> {
    if (!image) return ""

    if (!image.startsWith("gs://")) {
        return image
    }

    const cached = imageUrlCache.get(image)

    if (cached) return cached

    const request = getDownloadURL(ref(storage, image))
    .catch((error) => {
        imageUrlCache.delete(image)
        console.error("Failed to resolve Storage image:", image, error)
        return ""
    })

    imageUrlCache.set(image, request)

    return request
}