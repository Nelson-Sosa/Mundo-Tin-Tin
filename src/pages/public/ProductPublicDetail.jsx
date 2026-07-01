import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ImageOff,
  Package,
  Tag,
  FileText,
  CheckCircle,
  XCircle,
  Layers,
  ZoomIn,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getActiveProductById } from "../../services/publicProductService";
import { formatCurrency } from "../../utils/formatCurrency";
import { getDetailImage, getThumbImage, getZoomImage } from "../../lib/cloudinary";
import WhatsAppButton from "../../components/public/WhatsAppButton";

// ---------------------------------------------------------------------------
// Lightbox — Zoom modal sin librerías externas
// ---------------------------------------------------------------------------

function ZoomLightbox({ images, initialIndex, onClose }) {
  const [current, setCurrent] = useState(initialIndex);

  // Navegación con teclado
  const handleKey = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrent((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft")
        setCurrent((i) => (i - 1 + images.length) % images.length);
    },
    [images.length, onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    // Bloquear scroll del body mientras el lightbox está abierto
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  const zoomSrc = getZoomImage(images[current]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Cerrar */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        aria-label="Cerrar zoom"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Navegación previa */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrent((i) => (i - 1 + images.length) % images.length);
          }}
          className="absolute left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="Imagen anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Imagen zoom */}
      <div
        className="relative max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {zoomSrc ? (
          <img
            src={zoomSrc}
            alt={`Zoom imagen ${current + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            draggable={false}
          />
        ) : (
          <div className="flex h-64 w-64 items-center justify-center">
            <ImageOff className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>

      {/* Navegación siguiente */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrent((i) => (i + 1) % images.length);
          }}
          className="absolute right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="Imagen siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Indicador de posición */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setCurrent(i);
              }}
              className={`h-1.5 rounded-full transition-all ${
                i === current ? "w-5 bg-white" : "w-1.5 bg-white/40"
              }`}
              aria-label={`Ir a imagen ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

export default function ProductPublicDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getActiveProductById(id)
      .then((data) => {
        if (!data) {
          setNotFound(true);
          return;
        }
        setProduct(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-gray-100" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-xl bg-gray-100" />
          <div className="space-y-4">
            <div className="h-6 w-3/4 animate-pulse rounded bg-gray-100" />
            <div className="h-8 w-1/3 animate-pulse rounded bg-gray-100" />
            <div className="h-20 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
          <Package className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mt-5 text-base font-semibold text-gray-800">
          Producto no encontrado
        </h3>
        <p className="mt-1.5 text-sm text-gray-500">
          El producto que buscás no está disponible o fue desactivado.
        </p>
        <button
          onClick={() => navigate("/catalogo")}
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al catálogo
        </button>
      </div>
    );
  }

  const images = Array.isArray(product.images) ? product.images : [];
  // c_pad → Cloudinary entrega siempre 1200×1200 con padding blanco
  // La imagen original nunca se recorta ni distorsiona
  const mainImageUrl =
    images.length > 0 ? getDetailImage(images[selectedImage]) : null;
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="space-y-6">
      {/* Botón volver */}
      <button
        onClick={() => navigate("/catalogo")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al catálogo
      </button>

      {/* 
        Grid responsive:
          Mobile:  columna única, imagen grande centrada (mobile-first)
          Tablet:  columna única, imagen limitada a 480px centrada
          Desktop: 2 columnas — imagen compacta | info del producto
      */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr] xl:grid-cols-[minmax(0,460px)_1fr]">
        {/* Columna de imágenes */}
        <div className="mx-auto w-full max-w-sm sm:max-w-md lg:mx-0 lg:max-w-none">
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border">
            {/* 
              Imagen principal — c_pad: Cloudinary entrega 1200×1200 con padding blanco.
              El contenedor es siempre cuadrado (aspect-square) para layout estable.
              object-contain: la imagen ocupa su espacio natural sin ningún crop.
            */}
            <div className="relative aspect-square overflow-hidden bg-white">
              {mainImageUrl ? (
                <div className="group relative h-full w-full">
                  <img
                    src={mainImageUrl}
                    alt={product.name}
                    className="h-full w-full object-contain"
                    decoding="async"
                    loading="eager"
                    fetchPriority="high"
                  />
                  {/* Botón de zoom */}
                  <button
                    onClick={() => setLightboxOpen(true)}
                    className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                    aria-label="Ampliar imagen"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                    Ampliar
                  </button>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-300">
                  <ImageOff className="h-16 w-16" />
                  <span className="text-sm">Sin imagen</span>
                </div>
              )}
            </div>

            {/* Selector de imágenes (thumbnails) */}
            {images.length > 1 && (
              <div className="flex gap-2 border-t border-border p-3">
                {images.map((img, i) => {
                  const thumbUrl = getThumbImage(img, 56);
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                        i === selectedImage
                          ? "border-primary ring-1 ring-primary/30"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                      aria-label={`Ver imagen ${i + 1}`}
                    >
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={`${product.name} ${i + 1}`}
                          className="h-full w-full object-cover"
                          loading="eager"
                          decoding="async"
                          fetchPriority="high"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100">
                          <ImageOff className="h-4 w-4 text-gray-300" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Info del producto */}
        <div className="space-y-5">
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-border sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">
                  {product.name}
                </h1>
                {product.categoryName && (
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary-light px-3 py-0.5 text-xs font-medium text-primary">
                    <Tag className="h-3 w-3" />
                    {product.categoryName}
                  </span>
                )}
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                  isOutOfStock
                    ? "bg-red-50 text-red-600"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {isOutOfStock ? (
                  <>
                    <XCircle className="h-3.5 w-3.5" />
                    Agotado
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" />
                    Disponible
                  </>
                )}
              </span>
            </div>

            <p className="mt-4 text-2xl font-bold text-primary sm:text-3xl">
              {formatCurrency(product.salePrice)}
            </p>

            {product.description && (
              <div className="mt-5 border-t border-border pt-5">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <FileText className="h-3.5 w-3.5" />
                  Descripción
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                  {product.description}
                </p>
              </div>
            )}

            <div className="mt-6">
              <WhatsAppButton
                productName={product.name}
                productPrice={formatCurrency(product.salePrice)}
                variant="inline"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Atributos */}
      {product.attributes?.length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-border sm:p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
            <Layers className="h-4 w-4" />
            Atributos
          </h3>
          <div className="mt-4 flex flex-wrap gap-6">
            {product.attributes.map((attr, i) => (
              <div key={i}>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {attr.name}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {(attr.values || [])
                    .filter((v) => v?.trim())
                    .map((val, j) => (
                      <span
                        key={j}
                        className="rounded-lg border border-border bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700"
                      >
                        {val}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp flotante */}
      <WhatsAppButton
        productName={product.name}
        productPrice={formatCurrency(product.salePrice)}
        variant="floating"
      />

      {/* Lightbox de zoom — se monta solo cuando se abre */}
      {lightboxOpen && images.length > 0 && (
        <ZoomLightbox
          images={images}
          initialIndex={selectedImage}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
