import { useState, useRef } from "react";
import { Upload, X, GripVertical } from "lucide-react";
import { getImageUrl } from "../../services/cloudinary";

export default function ProductGallery({ images = [], onChange, uploading }) {
  const inputRef = useRef(null);
  const [dragIndex, setDragIndex] = useState(null);

  function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if (files.length) onChange([...images, ...files]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleRemove(index) {
    const next = images.filter((_, i) => i !== index);
    onChange(next);
  }

  function handleDragStart(index) {
    setDragIndex(index);
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const next = [...images];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    onChange(next);
    setDragIndex(index);
  }

  function handleDragEnd() {
    setDragIndex(null);
  }

  function getDisplaySrc(item) {
    if (item instanceof File) return URL.createObjectURL(item);
    return getImageUrl(item);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {images.map((item, i) => {
          const src = getDisplaySrc(item);
          return (
            <div
              key={i}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              className={`group relative aspect-square overflow-hidden rounded-lg border-2 bg-white transition-all ${
                dragIndex === i ? "border-primary opacity-60" : "border-gray-200"
              }`}
            >
              <img
                src={src}
                alt={`Imagen ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-start justify-between bg-black/0 p-1 transition-colors group-hover:bg-black/20">
                <div className="cursor-grab rounded bg-white/80 p-1 text-gray-500 shadow-sm">
                  <GripVertical className="h-3.5 w-3.5" />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  className="rounded bg-white/80 p-1 text-red-500 shadow-sm transition-colors hover:bg-red-500 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {i === 0 && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                  Principal
                </span>
              )}
            </div>
          );
        })}

        {images.length < 5 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-primary hover:bg-primary-light disabled:opacity-50"
          >
            {uploading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <>
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-[10px] font-medium text-gray-500">
                  Subir
                </span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      <p className="text-xs text-gray-400">
        {images.length}/5 imágenes. Arrastra para reordenar. La primera será la imagen principal.
      </p>
    </div>
  );
}
