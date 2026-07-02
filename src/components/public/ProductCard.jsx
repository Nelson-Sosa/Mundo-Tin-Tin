import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import ProductImage from "../ui/ProductImage";
import { formatCurrency } from "../../utils/formatCurrency";

function ProductCardBase({ product }) {
  const navigate = useNavigate();
  const image =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : null;
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border transition-all hover:shadow-md">
      {/* Imagen de catálogo — c_fill 600×600, optimizada para grids */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <ProductImage
          image={image}
          type="catalog"
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          wrapperClassName="h-full w-full"
        />

        {/* Badge de categoría */}
        {product.categoryName && (
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-medium text-gray-600 shadow-sm backdrop-blur-sm">
            {product.categoryName}
          </span>
        )}

        {/* Overlay agotado */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-danger px-3 py-1 text-xs font-semibold text-white shadow">
              Agotado
            </span>
          </div>
        )}
      </div>

      {/* Info del producto */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">
          {product.name}
        </h3>
        <p className="mt-1.5 text-base font-bold text-primary">
          {formatCurrency(product.salePrice)}
        </p>

        <div className="mt-auto pt-4">
          <button
            onClick={() => navigate(`/catalogo/${product.id}`)}
            className="flex w-full items-center justify-center gap-1 rounded-lg bg-primary-light py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
          >
            Ver detalles
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

const ProductCard = memo(ProductCardBase);
export default ProductCard;
