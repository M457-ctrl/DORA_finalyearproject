import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts";
import HeroImg from "@/assets/Hero.jpg";
import ProductCard from "@/components/ui/ProductCard";
import { getAllProducts, type Product } from "@/services/productsService";

const Home: React.FC = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await getAllProducts({ limit: 10, page: 1 });
        if (res?.success) setAllProducts(res.data || []);
      } catch (e: unknown) {
        const message =
          (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message || "Failed to load products";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onViewDetails = (productId: string) => {
    navigate(`/products?highlight=${productId}`);
  };

  const onBuy = (productId: string) => {
    navigate(`/checkout/${productId}`);
  };

  // Helpers: group products by broad categories (case-insensitive)
  const isMatch = (value: string | undefined, variants: string[]) => {
    if (!value) return false;
    const v = value.toLowerCase();
    return variants.some((x) => v.includes(x));
  };

  const { vegetables, fruits, dried } = useMemo(() => {
    const veg = allProducts
      .filter((p) => isMatch(p.category, ["vegetable", "vegetables", "veg"]))
      .slice(0, 4);
    // Only show products explicitly marked as seasonal
    const fr = allProducts.filter((p) => p.isSeasonal === true).slice(0, 4);
    const dr = allProducts
      .filter(
        (p) =>
          isMatch(p.category, [
            "dried",
            "dry",
            "dried-product",
            "dried products",
            "dried fruits",
          ]) || isMatch(p.cropName, ["dried"]),
      )
      .slice(0, 4);
    return { vegetables: veg, fruits: fr, dried: dr };
  }, [allProducts]);

  return (
    <MainLayout>
      {/* Hero Section */}
      <section
        className="relative h-[60vh] md:h-[70vh] w-full"
        style={{
          backgroundImage: `url(${HeroImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative max-w-7xl mx-auto h-full flex items-center px-4 sm:px-6 lg:px-8">
          <div className="text-white">
            <h1 className="text-4xl md:text-6xl font-extrabold drop-shadow">
              NepAgriMarket
            </h1>
            <p className="mt-4 text-lg md:text-xl max-w-2xl">
              "Let farmers earn fair value, and buyers get fresh produce."
            </p>
            <p className="mt-2 text-base md:text-lg max-w-2xl text-gray-200">
              Building a transparent, sustainable marketplace for Nepal's rural
              agriculture.
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                to="/products"
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 rounded text-white font-medium"
              >
                Browse Products
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 bg-white/90 hover:bg-white rounded text-gray-900 font-medium"
              >
                Become a Seller
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* Category Sections */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Vegetables */}
        <div className="mb-10">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold fade-in-up">
                Fresh Vegetables
              </h2>
              <p
                className="text-gray-600 fade-in-up"
                style={{ animationDelay: "60ms" }}
              >
                Crisp and organic greens straight from farms
              </p>
            </div>
            <Link
              to="/products"
              className="text-green-700 hover:text-green-800 font-medium fade-in-up"
              style={{ animationDelay: "90ms" }}
            >
              See all
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-200 h-80 rounded animate-pulse"
                />
              ))}
            </div>
          ) : vegetables.length === 0 ? (
            <div className="text-gray-600">No vegetables available yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {vegetables.map((p, idx) => (
                <div
                  key={p.id}
                  className="fade-in-up"
                  style={{ animationDelay: `${(idx % 8) * 50}ms` }}
                >
                  <ProductCard
                    product={p}
                    onViewDetails={onViewDetails}
                    onBuy={onBuy}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fruits */}
        <div className="mb-10">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold fade-in-up">
                Seasonal Fruits
              </h2>
              <p
                className="text-gray-600 fade-in-up"
                style={{ animationDelay: "60ms" }}
              >
                Sweet, ripe, and farm-fresh selections
              </p>
            </div>
            <Link
              to="/products"
              className="text-green-700 hover:text-green-800 font-medium fade-in-up"
              style={{ animationDelay: "90ms" }}
            >
              See all
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-200 h-80 rounded animate-pulse"
                />
              ))}
            </div>
          ) : fruits.length === 0 ? (
            <div className="text-gray-600">No fruits available yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {fruits.map((p, idx) => (
                <div
                  key={p.id}
                  className="fade-in-up"
                  style={{ animationDelay: `${(idx % 8) * 50}ms` }}
                >
                  <ProductCard
                    product={p}
                    onViewDetails={onViewDetails}
                    onBuy={onBuy}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dried Products */}
        <div className="mb-4">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold fade-in-up">
                Dried Products
              </h2>
              <p
                className="text-gray-600 fade-in-up"
                style={{ animationDelay: "60ms" }}
              >
                Long-lasting, preserved produce and staples
              </p>
            </div>
            <Link
              to="/products"
              className="text-green-700 hover:text-green-800 font-medium fade-in-up"
              style={{ animationDelay: "90ms" }}
            >
              See all
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-200 h-80 rounded animate-pulse"
                />
              ))}
            </div>
          ) : dried.length === 0 ? (
            <div className="text-gray-600">
              No dried products available yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dried.map((p, idx) => (
                <div
                  key={p.id}
                  className="fade-in-up"
                  style={{ animationDelay: `${(idx % 8) * 50}ms` }}
                >
                  <ProductCard
                    product={p}
                    onViewDetails={onViewDetails}
                    onBuy={onBuy}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
};

export default Home;
