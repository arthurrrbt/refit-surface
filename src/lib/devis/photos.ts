import { MAX_PHOTO_BYTES } from "./schema";

const MAX_DIMENSION = 2000;

/** Réduit une photo de téléphone (souvent 4–10 Mo) à ~2000 px en JPEG avant envoi. */
export async function preparePhoto(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!blob) throw new Error("conversion impossible");
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    // Format non décodable par le navigateur (ex. HEIC sur ordinateur) : on envoie l'original
    if (file.size > MAX_PHOTO_BYTES) throw new Error("Photo trop lourde (10 Mo maximum).");
    return file;
  }
}

export function photoExtension(file: File): string {
  const byType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
  };
  return byType[file.type] ?? file.name.split(".").pop()?.toLowerCase() ?? "jpg";
}
