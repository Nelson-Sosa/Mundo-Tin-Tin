/**
 * imageConfig.js
 *
 * Fuente única de verdad para todas las transformaciones de imágenes Cloudinary.
 * Modificar aquí cambia el comportamiento en toda la app.
 *
 * Regla arquitectónica:
 *   - CATALOG  → c_fill   (uniformidad visual, performance)
 *   - DETAIL   → c_pad    (alta calidad, sin crop, padding blanco para uniformidad)
 *   - ZOOM     → c_limit  (máxima nitidez para lightbox, imagen completa)
 *   - THUMB    → c_fill   (miniaturas admin, tamaño fijo)
 *   - MASTER   → sin transformación (imagen original de Cloudinary)
 */

/** Límite de tamaño de archivo permitido al subir (10 MB) */
export const MAX_UPLOAD_SIZE_MB = 10;
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

/**
 * Transformaciones Cloudinary por tipo de contexto.
 * El orden de los parámetros importa para el cache de Cloudinary.
 */
export const IMAGE_TRANSFORMS = {
  /**
   * CATALOG — Cards del catálogo público y grids de productos.
   * Objetivo: uniformidad visual + performance (imágenes livianas).
   * c_fill: recorta al cuadrado exacto → todas las cards lucen iguales.
   * g_auto: punto de recorte inteligente (face/saliency detection).
   * q_auto:good: balance calidad/peso optimizado para grids.
   * f_auto: formato moderno (WebP/AVIF según soporte del browser).
   */
  catalog: "c_fill,g_auto,w_600,h_600,q_auto:good,f_auto",

  /**
   * DETAIL — Vista principal del producto.
   * Objetivo: máxima calidad, sin distorsión, contenedor cuadrado uniforme.
   *
   * c_pad: NUNCA recorta. Agrega padding blanco (b_white) para completar
   *   el cuadrado de 1200×1200 con la imagen original centrada.
   *   Imágenes verticales, horizontales y cuadradas quedan perfectas.
   * b_white: fondo blanco en el padding (cambiar a b_auto para IA de color).
   * q_auto:best: prioriza calidad sobre peso.
   *
   * Resultado: todas las vistas de producto lucen uniformes sin perder
   * ni un píxel de la imagen original.
   */
  detail: "c_pad,w_1200,h_1200,b_white,q_auto:best,f_auto",

  /**
   * ZOOM — Lightbox / ampliación al hacer click en la imagen.
   * Objetivo: máxima nitidez posible.
   * q_100: sin compresión, fidelidad absoluta.
   * Ancho mayor para pantallas retina/4K.
   */
  zoom: "c_limit,w_2400,q_100,f_auto",

  /**
   * MASTER — Imagen original sin ninguna transformación.
   * Usado como fallback o para descargas.
   * La URL se construye sin parámetros de transformación.
   */
  master: null,
};

/**
 * Tipos de imagen válidos para getProductImage().
 */
export const IMAGE_TYPES = /** @type {const} */ ({
  CATALOG: "catalog",
  DETAIL: "detail",
  ZOOM: "zoom",
  THUMB: "thumb",
  MASTER: "master",
});
