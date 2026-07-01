/**
 * ProductImage.jsx — Componente universal de imágenes de producto
 *
 * Optimizaciones de performance incluidas:
 *   1. LQIP (Low Quality Image Placeholder): placeholder borroso de ~20px
 *      que carga en <50ms y se reemplaza con fade-in por la imagen real.
 *   2. Lazy loading con IntersectionObserver (preload 200px antes del viewport).
 *   3. fetchpriority="high" para imágenes above-the-fold (eager=true).
 *   4. decoding="async" para no bloquear el hilo principal del browser.
 *   5. Skeleton animado como fallback cuando no hay LQIP disponible.
 *
 * @example
 * // Catálogo (lazy, con LQIP automático)
 * <ProductImage image={product.images[0]} type="catalog" alt={product.name} />
 *
 * // Detalle above-the-fold (eager + fetchpriority high)
 * <ProductImage image={product.images[0]} type="detail" alt={product.name} eager />
 *
 * // Miniatura de 56px
 * <ProductImage image={img} type="thumb" thumbSize={56} alt="thumb" />
 */

import { useState, useEffect, useRef } from "react";
import { ImageOff } from "lucide-react";
import { getProductImage, getLqipImage } from "../../lib/cloudinary";

/**
 * @param {Object} props
 * @param {string|File|{url:string,publicId?:string}|null} props.image
 * @param {'catalog'|'detail'|'zoom'|'thumb'|'master'} props.type
 * @param {string} [props.alt='']
 * @param {number} [props.thumbSize=80]
 * @param {string} [props.className=''] - Clases CSS adicionales para el <img>
 * @param {string} [props.wrapperClassName=''] - Clases CSS para el wrapper
 * @param {boolean} [props.eager=false] - true → carga inmediata + fetchpriority high
 * @param {Function} [props.onLoad]
 * @param {Function} [props.onError]
 */
export default function ProductImage({
  image,
  type = "catalog",
  alt = "",
  thumbSize = 80,
  className = "",
  wrapperClassName = "",
  eager = false,
  onLoad,
  onError,
}) {
  const [isInView, setIsInView] = useState(eager);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const wrapperRef = useRef(null);

  // Obtener URLs desde el motor central
  const src = getProductImage(image, type, thumbSize);
  const lqipSrc = getLqipImage(image); // ~500 bytes, carga instantánea

  // IntersectionObserver para lazy loading nativo
  useEffect(() => {
    if (eager) return;

    const el = wrapperRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "200px", // Pre-carga 200px antes de entrar al viewport
        threshold: 0,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [eager]);

  // Reset de estado cuando cambia la imagen
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  function handleLoad() {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  }

  function handleError() {
    setIsLoaded(true);
    setHasError(true);
    onError?.();
  }

  return (
    <div ref={wrapperRef} className={`relative overflow-hidden ${wrapperClassName}`}>

      {/*
        LQIP — Low Quality Image Placeholder
        Se muestra mientras la imagen real se descarga.
        Es una versión borrosa de 20px que pesa <500 bytes y aparece casi
        instantáneamente, eliminando el salto visual del skeleton gris.
        El filtro blur(8px) suaviza los píxeles amplificados.
      */}
      {lqipSrc && !isLoaded && !hasError && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${lqipSrc})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(8px)",
            transform: "scale(1.05)", // evita bordes borrosos visibles
          }}
        />
      )}

      {/* Skeleton — solo visible cuando no hay LQIP y aún no cargó */}
      {!lqipSrc && !isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gray-100" />
      )}

      {/* Fallback de error */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-gray-50">
          <ImageOff className="h-6 w-6 text-gray-300" />
          <span className="text-[10px] text-gray-400">Sin imagen</span>
        </div>
      )}

      {/* Imagen real */}
      {isInView && src && !hasError && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          decoding="async"
          // fetchpriority="high" solo en imágenes above-the-fold (eager)
          // Le dice al browser que priorice esta descarga sobre otros recursos
          fetchPriority={eager ? "high" : "auto"}
          className={`
            transition-opacity duration-300 ease-in-out
            ${isLoaded ? "opacity-100" : "opacity-0"}
            ${className}
          `}
        />
      )}

      {/* Placeholder sin imagen */}
      {!src && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <ImageOff className="h-6 w-6 text-gray-300" />
        </div>
      )}
    </div>
  );
}
