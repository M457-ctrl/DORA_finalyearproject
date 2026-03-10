import React from "react";
import type { Product } from "@/services/productsService";
import { ShoppingCart, MapPin, Calendar } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onViewDetails: (productId: string) => void;
  onBuy?: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewDetails,
  onBuy,
}) => {
  const priceRange = `Rs. ${product.minPriceExpected} - Rs. ${product.maxPriceExpected}`;
  const imagePlaceholder =
    "https://via.placeholder.com/300x200?text=" +
    encodeURIComponent(product.cropName);

  return (
    <div
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
      onClick={() => onViewDetails(product.id)}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden bg-gray-200 h-48">
        <img
          src={product.imageUrl || imagePlaceholder}
          alt={product.cropName}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold text-lg">Sold Out</span>
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="p-4">
        {/* Category Badge */}
        <div className="mb-2">
          <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
            {product.category}
          </span>
        </div>

        {/* Crop Name */}
        <h3 className="text-lg font-bold text-gray-800 mb-2 truncate">
          {product.cropName}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {product.description}
        </p>

        {/* Quantity Info */}
        <div className="flex items-center text-sm text-gray-700 mb-3">
          <ShoppingCart className="w-4 h-4 mr-2" />
          <span>
            {product.quantity} {product.unit}
          </span>
        </div>

        {/* Location */}
        {product.location && (
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <MapPin className="w-4 h-4 mr-2" />
            <span className="truncate">{product.location}</span>
          </div>
        )}

        {/* Harvest Date */}
        {product.harvestDate && (
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{new Date(product.harvestDate).toLocaleDateString()}</span>
          </div>
        )}

        {/* Price Section */}
        <div className="border-t pt-3">
          <div className="text-sm text-gray-600 mb-1">Expected Price:</div>
          <div className="text-xl font-bold text-green-600">{priceRange}</div>
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            👁 {product.viewCount} views
          </div>
          {product.isAvailable && onBuy && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBuy(product.id);
              }}
              className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Buy Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
