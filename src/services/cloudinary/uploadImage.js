/**
 * uploadImage.js — Servicio de subida de imágenes a Cloudinary
 *
 * Responsabilidades:
 *   1. Validar el archivo antes de subirlo (tipo, tamaño)
 *   2. Subir a Cloudinary vía upload sin autenticación (preset público)
 *   3. Retornar metadata completa: url, publicId, dimensiones, formato
 *
 * La eliminación de imágenes requiere backend (Cloud Function).
 * Ver: services/cloudinary/deleteImage.js
 */

import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_MB } from "../../lib/imageConfig";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const ENDPOINT = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * Valida un archivo de imagen antes del upload.
 * @param {File} file
 * @throws {Error} Si el archivo no es válido
 */
function validateFile(file) {
  if (!(file instanceof File)) {
    throw new Error("El archivo debe ser un objeto File válido.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error(
      `Formato no permitido: "${file.type}". Solo se aceptan imágenes (JPEG, PNG, WebP, GIF, etc).`
    );
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    throw new Error(
      `La imagen pesa ${sizeMB} MB. El máximo permitido es ${MAX_UPLOAD_SIZE_MB} MB.`
    );
  }
}

/**
 * Sube una imagen a Cloudinary y retorna su metadata completa.
 *
 * @param {File} file - Archivo de imagen a subir
 * @returns {Promise<{
 *   url: string,
 *   publicId: string,
 *   width: number,
 *   height: number,
 *   format: string,
 *   bytes: number,
 *   aspectRatio: number
 * }>}
 *
 * @throws {Error} Si faltan variables de entorno, el archivo es inválido,
 *                 o la respuesta de Cloudinary es un error
 */
export async function uploadImage(file) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary no está configurado. Verifica VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET en el archivo .env"
    );
  }

  // Validación antes de la petición de red
  validateFile(file);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(ENDPOINT, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message ||
        `Error al subir imagen (HTTP ${response.status})`
    );
  }

  const data = await response.json();

  /**
   * Retornamos metadata completa de Cloudinary.
   * Esto permite:
   *   - Conocer las dimensiones originales sin descargar la imagen
   *   - Calcular el aspect ratio para el layout
   *   - Auditar el peso de las imágenes subidas
   *   - Preparar eager transformations futuras
   */
  return {
    /** URL segura (https) de la imagen original (MASTER) */
    url: data.secure_url,
    /** ID público en Cloudinary — necesario para construir URLs con transformaciones */
    publicId: data.public_id,
    /** Dimensiones originales de la imagen subida */
    width: data.width,
    height: data.height,
    /** Formato original (jpg, png, webp, etc) */
    format: data.format,
    /** Tamaño en bytes de la imagen original */
    bytes: data.bytes,
    /** Ratio ancho/alto (útil para placeholders y layouts responsivos) */
    aspectRatio: data.width && data.height ? data.width / data.height : 1,
  };
}
