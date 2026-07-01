/**
 * cloudinary.js — Motor central de URLs de imágenes
 *
 * PRINCIPIO ARQUITECTÓNICO:
 *   Una sola fuente de verdad: getProductImage(image, type)
 *   Todo el sistema depende de esta función.
 *
 * Tipos de imagen soportados:
 *   - catalog  → c_fill 600×600, calidad optimizada (catálogo/cards)
 *   - detail   → c_pad 1200×1200, máxima calidad, padding blanco (detalle de producto)
 *   - zoom     → c_limit 2400px, q_100 (lightbox / ampliación)
 *   - thumb    → c_fill tamaño dinámico (miniaturas admin/galería)
 *   - master   → sin transformación (imagen original de Cloudinary)
 *   - lqip     → 20px borrosa (<500 bytes) para placeholder instantáneo
 *
 * Formatos de imagen aceptados como input:
 *   - string:   URL directa (legacy, sin transformaciones Cloudinary)
 *   - File:     archivo local (previa al upload, blob URL temporal)
 *   - { url, publicId }: objeto guardado en Firestore (formato estándar)
 *   - { url }:  objeto sin publicId (fallback a URL directa)
 */

import { IMAGE_TRANSFORMS } from "./imageConfig";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;

// ---------------------------------------------------------------------------
// FUNCIÓN INTERNA — Constructor de URLs
// ---------------------------------------------------------------------------

/**
 * Construye la URL de Cloudinary con la transformación especificada.
 *
 * @param {string|File|{url:string, publicId?:string}|null} image
 * @param {string|null} transformation - String de transformación Cloudinary o null para MASTER
 * @returns {string|null}
 */
function buildUrl(image, transformation) {
  if (!image) return null;

  // Archivo local (antes del upload a Cloudinary)
  if (image instanceof File) {
    return URL.createObjectURL(image);
  }

  // String URL directa (legacy o URLs externas)
  if (typeof image === "string") {
    if (!image.trim()) return null;
    return image;
  }

  // Objeto { publicId, url } guardado en Firestore (formato estándar)
  if (typeof image === "object") {
    // Con publicId: construimos URL con transformación de Cloudinary
    if (image.publicId) {
      if (transformation) {
        return `${BASE_URL}/${transformation}/${image.publicId}`;
      }
      // MASTER: sin transformación (imagen original)
      return `${BASE_URL}/${image.publicId}`;
    }

    // Sin publicId: fallback a la URL directa guardada
    if (image.url) return image.url;
  }

  return null;
}

// ---------------------------------------------------------------------------
// API PÚBLICA — getProductImage (función central)
// ---------------------------------------------------------------------------

/**
 * Función central del sistema de imágenes.
 * Todo el frontend debe pasar por aquí para obtener URLs de imágenes.
 *
 * @param {string|File|{url:string, publicId?:string}|null} image
 * @param {'catalog'|'detail'|'zoom'|'thumb'|'master'} type
 * @param {number} [thumbSize=80] - Tamaño en px para tipo 'thumb'
 * @returns {string|null}
 *
 * @example
 * // Catálogo
 * getProductImage(product.images[0], 'catalog')
 *
 * // Detalle alta calidad
 * getProductImage(product.images[0], 'detail')
 *
 * // Zoom lightbox
 * getProductImage(product.images[0], 'zoom')
 *
 * // Miniatura de 80px
 * getProductImage(product.images[0], 'thumb', 80)
 *
 * // Original sin transformar
 * getProductImage(product.images[0], 'master')
 */
export function getProductImage(image, type, thumbSize = 80) {
  switch (type) {
    case "catalog":
      return buildUrl(image, IMAGE_TRANSFORMS.catalog);

    case "detail":
      // CRÍTICO: c_limit → nunca hace crop, nunca amplía, respeta ratio original
      return buildUrl(image, IMAGE_TRANSFORMS.detail);

    case "zoom":
      return buildUrl(image, IMAGE_TRANSFORMS.zoom);

    case "thumb":
      return buildUrl(
        image,
        `c_fill,g_auto,w_${thumbSize},h_${thumbSize},q_auto`
      );

    case "master":
      // Sin transformación: imagen original de Cloudinary
      return buildUrl(image, IMAGE_TRANSFORMS.master);

    default:
      console.warn(`[cloudinary] Tipo de imagen desconocido: "${type}". Usando 'detail'.`);
      return buildUrl(image, IMAGE_TRANSFORMS.detail);
  }
}

// ---------------------------------------------------------------------------
// SHORTCUTS — Compatibilidad y ergonomía
// ---------------------------------------------------------------------------

/**
 * Imagen para catálogo (cards/grids).
 * c_fill 600×600 — uniforme, optimizada para listas.
 */
export function getCatalogImage(image) {
  return getProductImage(image, "catalog");
}

/**
 * Imagen para vista de detalle del producto.
 * c_limit 1200px — alta calidad, SIN crop, respeta aspect ratio.
 *
 * ⚠ IMPORTANTE: Usa c_limit, NO c_fill.
 * Imágenes verticales, horizontales y cuadradas se ven sin distorsión.
 */
export function getDetailImage(image) {
  return getProductImage(image, "detail");
}

/**
 * Imagen para zoom / lightbox.
 * c_limit 2400px — máxima nitidez, q_100.
 */
export function getZoomImage(image) {
  return getProductImage(image, "zoom");
}

/**
 * Imagen original sin transformaciones (MASTER).
 * Sirve como fallback o para descarga directa.
 */
export function getMasterImage(image) {
  return getProductImage(image, "master");
}

/**
 * Miniatura para galería admin o selectores de imágenes.
 * @param {*} image
 * @param {number} [size=80] - Tamaño en px (ancho y alto)
 */
export function getThumbImage(image, size = 80) {
  return getProductImage(image, "thumb", size);
}

/**
 * LQIP — Low Quality Image Placeholder.
 *
 * Genera una versión minima de ~20px de ancho con blur extremo.
 * Pesa menos de 500 bytes y carga en <50ms.
 * Usada como fondo borroso mientras la imagen real se descarga,
 * eliminando el salto visual del skeleton gris.
 *
 * Tecnología: Cloudinary e_blur + q_1 (calidad mínima, máximo blur)
 *
 * @param {string|File|{url:string,publicId?:string}|null} image
 * @returns {string|null}
 */
export function getLqipImage(image) {
  // Solo funciona con publicId — para File locales no hay LQIP
  if (!image || image instanceof File) return null;
  if (typeof image === "string") return null; // URL directa sin transformación disponible

  return buildUrl(
    image,
    // 20px de ancho, q_1 (mínima calidad), blur de 800 unidades
    // Resultado: imagen apenas reconocible pero del mismo color/forma → <500 bytes
    "c_pad,w_20,h_20,b_white,q_1,f_auto,e_blur:800"
  );
}
