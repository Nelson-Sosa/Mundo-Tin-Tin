export function getImageUrl(image) {
  if (typeof image === "string") return image;
  if (image instanceof File) return URL.createObjectURL(image);
  if (image && typeof image === "object" && image.url) return image.url;
  return null;
}

export function isFile(image) {
  return image instanceof File;
}

export function isStoredImage(image) {
  return typeof image === "string" || (image && typeof image === "object" && image.url);
}
