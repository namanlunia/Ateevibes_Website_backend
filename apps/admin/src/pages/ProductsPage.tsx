import React, { useState, useEffect } from "react";
import { Search, Edit, Archive, Plus } from "lucide-react";
import { apiClient } from "../api/client";
import { Product } from "../types";
import { ProductFormModal } from "../components/products/ProductFormModal";

interface CategoryOption {
  id: string;
  slug: string;
  name: string;
  subCategories?: { id: string; slug: string; name: string }[];
}

const FALLBACK_CATEGORIES: CategoryOption[] = [
  { id: "cat-round-neck", slug: "round-neck", name: "Round Neck Tees" },
  { id: "cat-polo-collar", slug: "polo-collar", name: "Polo & Collar Tees" },
  { id: "cat-jacquard", slug: "jacquard", name: "Jacquard Knits" },
  { id: "cat-printed", slug: "printed", name: "Printed & Tai Dai" },
];

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>(FALLBACK_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Product Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Fetch dynamic categories from GET /categories
  useEffect(() => {
    apiClient<CategoryOption[]>("categories")
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setCategories(res);
        }
      })
      .catch(() => {
        // Graceful fallback to static categories
        setCategories(FALLBACK_CATEGORIES);
      });
  }, []);

  const fetchProducts = () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (selectedCategory) params.append("category", selectedCategory);
    params.append("limit", "50");

    apiClient<{ items: Product[] }>(`products?${params.toString()}`)
      .then((res) => setProducts(res.items || []))
      .catch((err) => console.error("Failed to fetch products:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setIsModalOpen(true);
  };

  const handleArchive = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to safely archive "${name}"? Historical orders will be preserved.`,
      )
    )
      return;
    try {
      await apiClient(`products/${id}`, { method: "DELETE" });
      fetchProducts();
    } catch (err: any) {
      alert(`Archive failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header with New Product Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-normal text-obsidian">Product Catalog</h2>
          <p className="text-xs text-ink-600 mt-0.5">Manage garment styles, verified fabrics, variants, and pricing</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="btn-gold px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-subtle shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Product</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-sandstone shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-ink-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, P.NO, fabric..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold text-obsidian"
            />
          </div>

          {/* Dynamic Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-ivory border border-sandstone rounded-lg px-3 py-2 focus:outline-none focus:border-gold text-obsidian"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-ink-600 font-medium whitespace-nowrap">
          {products.length} catalog styles active
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white border border-sandstone shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-ivory border-b border-sandstone text-ink-700 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 pl-4">Garment</th>
                <th className="py-3.5">Style (P.NO)</th>
                <th className="py-3.5">Category</th>
                <th className="py-3.5">Subcategory</th>
                <th className="py-3.5">Fabric</th>
                <th className="py-3.5">Price</th>
                <th className="py-3.5">Variants</th>
                <th className="py-3.5">Status</th>
                <th className="py-3.5 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sandstone/40">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-ink-500">
                    Loading catalog styles from authoritative database...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-ink-500">
                    No products found matching criteria.
                  </td>
                </tr>
              ) : (
                products.map((p: any) => {
                  const mainImg = p.variants?.[0]?.images?.[0] || "/brand/tshirt-silhouette.svg";
                  return (
                    <tr key={p.id} className="hover:bg-ivory/40 transition-colors">
                      <td className="py-3 pl-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={mainImg}
                            alt={p.name}
                            className="w-10 h-12 object-cover rounded bg-ivory border border-sandstone/60 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-obsidian line-clamp-1">{p.name}</p>
                            <span className="text-[10px] text-gold uppercase tracking-wider font-bold">
                              {p.sleeve} Sleeve • {p.neck} Neck
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 font-mono font-bold text-obsidian">{p.pno}</td>
                      <td className="py-3 text-ink-700 font-medium">{p.categoryName || p.category}</td>
                      <td className="py-3 text-ink-600 font-medium">{p.subCategoryName || p.subCategory || "—"}</td>
                      <td className="py-3 text-ink-600">{p.fabric}</td>
                      <td className="py-3 font-bold text-obsidian">₹{p.mrp?.toLocaleString("en-IN")}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          {p.variants?.slice(0, 4).map((v: any) => (
                            <span
                              key={v.id}
                              className="w-3.5 h-3.5 rounded-full border border-sandstone"
                              style={{ backgroundColor: v.hex }}
                              title={v.colourName}
                            />
                          ))}
                          {(p.variants?.length || 0) > 4 && (
                            <span className="text-[10px] text-ink-500">+{p.variants.length - 4}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            p.status === "active"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : p.status === "coming-soon"
                              ? "bg-obsidian text-gold border border-gold/40"
                              : "bg-sandstone/30 text-ink-600"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            aria-label={`Edit ${p.name}`}
                            className="p-1.5 text-ink-600 hover:text-gold hover:bg-sandstone/20 rounded transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleArchive(p.id, p.name)}
                            aria-label={`Archive ${p.name}`}
                            className="p-1.5 text-ink-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Create & Edit Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProducts}
        product={editingProduct}
        categories={categories}
      />
    </div>
  );
};
