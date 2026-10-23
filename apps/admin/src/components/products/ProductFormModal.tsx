import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Check, AlertCircle } from "lucide-react";
import { apiClient } from "../../api/client";
import { Product } from "../../types";

interface CategoryOption {
  id: string;
  slug: string;
  name: string;
  subCategories?: { id: string; slug: string; name: string }[];
}

interface VariantRow {
  id?: string;
  sku: string;
  colourName: string;
  colourSlug: string;
  hex: string;
  patternImage: string;
  images: string;
  stockS: number;
  stockM: number;
  stockL: number;
  stockXL: number;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: Product | null;
  categories: CategoryOption[];
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  product,
  categories,
}) => {
  const isEditing = Boolean(product && product.id);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [pno, setPno] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [sleeve, setSleeve] = useState("half");
  const [neck, setNeck] = useState("round");
  const [fabric, setFabric] = useState("");
  const [printType, setPrintType] = useState("Solid / Weave");
  const [mrp, setMrp] = useState<number | "">("");
  const [compareAtPrice, setCompareAtPrice] = useState<number | "">("");
  const [status, setStatus] = useState("active");
  const [badges, setBadges] = useState("");
  const [highlights, setHighlights] = useState("");
  const [description, setDescription] = useState("");

  // Variants state
  const [variants, setVariants] = useState<VariantRow[]>([
    {
      sku: "",
      colourName: "Obsidian Black",
      colourSlug: "obsidian-black",
      hex: "#111111",
      patternImage: "",
      images: "",
      stockS: 10,
      stockM: 12,
      stockL: 8,
      stockXL: 4,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill or reset
  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setSlug(product.slug || "");
      setPno(product.pno || "");
      setCategoryId(product.category || "");
      setSubCategoryId(product.subCategory || "");
      setSleeve(product.sleeve || "half");
      setNeck(product.neck || "round");
      setFabric(product.fabric || "");
      setPrintType(product.printType || "Solid / Weave");
      setMrp(product.mrp ?? "");
      setCompareAtPrice(product.compareAtPrice ?? "");
      setStatus(product.status || "active");
      setBadges(Array.isArray(product.badges) ? product.badges.join(", ") : "");
      setHighlights(Array.isArray(product.highlights) ? product.highlights.join(", ") : "");
      setDescription(product.description || "");

      if (Array.isArray(product.variants) && product.variants.length > 0) {
        setVariants(
          product.variants.map((v: any) => ({
            id: v.id,
            sku: v.sku || "",
            colourName: v.colourName || "",
            colourSlug: v.colourSlug || "",
            hex: v.hex || "#111111",
            patternImage: v.patternImage || "",
            images: Array.isArray(v.images) ? v.images.join(", ") : "",
            stockS: v.stockBySize?.S ?? 10,
            stockM: v.stockBySize?.M ?? 12,
            stockL: v.stockBySize?.L ?? 8,
            stockXL: v.stockBySize?.XL ?? 4,
          }))
        );
      }
    } else {
      setName("");
      setSlug("");
      setPno("");
      setCategoryId(categories[0]?.id || "");
      setSubCategoryId("");
      setSleeve("half");
      setNeck("round");
      setFabric("China Jacquard Knit");
      setPrintType("Solid / Weave");
      setMrp(1299);
      setCompareAtPrice(1599);
      setStatus("active");
      setBadges("Best Seller");
      setHighlights("Breathable Knit, Zero Shrinkage, Contour Fit");
      setDescription("Signature luxury architectural knit crafted in Surat, India.");
      setVariants([
        {
          sku: "",
          colourName: "Obsidian Black",
          colourSlug: "obsidian-black",
          hex: "#111111",
          patternImage: "",
          images: "/products/1007/black.jpg",
          stockS: 10,
          stockM: 12,
          stockL: 8,
          stockXL: 4,
        },
      ]);
    }
    setError(null);
  }, [product, isOpen, categories]);

  if (!isOpen) return null;

  // Auto-generate slug when name changes (creation only)
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      const generatedSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generatedSlug);
    }
  };

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        sku: pno ? `${pno}-VAR${prev.length + 1}`.toUpperCase() : "",
        colourName: "Champagne Gold",
        colourSlug: "champagne-gold",
        hex: "#C9A45C",
        patternImage: "",
        images: "",
        stockS: 10,
        stockM: 12,
        stockL: 8,
        stockXL: 4,
      },
    ]);
  };

  const handleRemoveVariant = (idx: number) => {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleVariantChange = (idx: number, field: keyof VariantRow, value: any) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      if (field === "colourName" && !updated[idx].colourSlug) {
        updated[idx].colourSlug = String(value)
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-");
      }
      return updated;
    });
  };

  const selectedCatObj = categories.find((c) => c.id === categoryId || c.slug === categoryId);
  const subCategoriesList = selectedCatObj?.subCategories || [];

  const isValid =
    name.trim().length > 0 &&
    pno.trim().length > 0 &&
    fabric.trim().length > 0 &&
    typeof mrp === "number" &&
    mrp > 0 &&
    variants.every(
      (v) =>
        v.colourName.trim().length > 0 &&
        v.stockS >= 0 &&
        v.stockM >= 0 &&
        v.stockL >= 0 &&
        v.stockXL >= 0
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);
    setError(null);

    const parsedBadges = badges
      .split(",")
      .map((b) => b.trim())
      .filter(Boolean);
    const parsedHighlights = highlights
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);

    try {
      if (isEditing && product) {
        // Update product attributes via PUT /products/:id
        const updatePayload = {
          name: name.trim(),
          description: description.trim(),
          mrp: Number(mrp),
          compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
          status,
          badges: parsedBadges,
          highlights: parsedHighlights,
        };
        await apiClient(`products/${product.id}`, {
          method: "PUT",
          body: JSON.stringify(updatePayload),
        });
      } else {
        // Create new product via POST /products exactly matching CreateProductDto
        const createPayload = {
          slug: slug.trim(),
          pno: pno.trim(),
          name: name.trim(),
          categoryId: selectedCatObj?.id || categoryId,
          subCategoryId: subCategoryId || undefined,
          sleeve,
          neck,
          fabric: fabric.trim(),
          printType: printType.trim() || undefined,
          mrp: Number(mrp),
          compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
          priceConfirmed: true,
          status,
          badges: parsedBadges,
          highlights: parsedHighlights,
          description: description.trim(),
          variants: variants.map((v, idx) => ({
            sku: v.sku.trim() || `${pno.trim()}-${v.colourSlug.trim() || idx + 1}`.toUpperCase(),
            colourName: v.colourName.trim(),
            colourSlug: v.colourSlug.trim(),
            hex: v.hex.trim(),
            patternImage: v.patternImage.trim() || undefined,
            images: v.images
              .split(",")
              .map((img) => img.trim())
              .filter(Boolean),
            stockLevels: [
              { size: "S", quantity: Number(v.stockS), lowStockThreshold: 3 },
              { size: "M", quantity: Number(v.stockM), lowStockThreshold: 3 },
              { size: "L", quantity: Number(v.stockL), lowStockThreshold: 3 },
              { size: "XL", quantity: Number(v.stockXL), lowStockThreshold: 3 },
            ],
          })),
        };

        await apiClient("products", {
          method: "POST",
          body: JSON.stringify(createPayload),
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-sandstone shadow-luxury max-w-3xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 bg-ivory border-b border-sandstone shrink-0">
          <div>
            <h3 className="font-serif text-xl font-normal text-obsidian">
              {isEditing ? `Edit Garment: ${product?.name}` : "Create New Catalog Garment"}
            </h3>
            <p className="text-xs text-ink-600 mt-0.5">
              Authoritative catalog specifications and inventory stock levels
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-500 hover:text-obsidian hover:bg-sandstone/30 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section: Basic Garment Details */}
          <div className="space-y-4">
            <h4 className="font-bold text-obsidian uppercase tracking-wider text-[11px] border-b border-sandstone pb-1">
              1. Garment Identity & Nomenclature
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-ink-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Royal Print China Jacquard Full Sleeve"
                  required
                  className="w-full px-3 py-2 bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold font-medium text-obsidian"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-700 mb-1">
                  Style P.NO <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={pno}
                  onChange={(e) => setPno(e.target.value)}
                  placeholder="e.g. 1007"
                  required
                  disabled={isEditing}
                  className="w-full px-3 py-2 bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold font-mono font-bold text-obsidian disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-700 mb-1">
                  Canonical URL Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="royal-print-china-jacquard"
                  required
                  disabled={isEditing}
                  className="w-full px-3 py-2 bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold font-mono text-obsidian disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-700 mb-1">Fabric & Texture <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={fabric}
                  onChange={(e) => setFabric(e.target.value)}
                  placeholder="e.g. China Jacquard Knit / 2-Way Stretch"
                  required
                  disabled={isEditing}
                  className="w-full px-3 py-2 bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold text-obsidian disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* Section: Category & Silhouette */}
          <div className="space-y-4">
            <h4 className="font-bold text-obsidian uppercase tracking-wider text-[11px] border-b border-sandstone pb-1">
              2. Hierarchy & Silhouette
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block font-semibold text-ink-700 mb-1">Primary Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setSubCategoryId("");
                  }}
                  disabled={isEditing}
                  className="w-full px-3 py-2 bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold text-obsidian disabled:opacity-60"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-ink-700 mb-1">Subcategory</label>
                <select
                  value={subCategoryId}
                  onChange={(e) => setSubCategoryId(e.target.value)}
                  disabled={isEditing || subCategoriesList.length === 0}
                  className="w-full px-3 py-2 bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold text-obsidian disabled:opacity-60"
                >
                  <option value="">None / Unassigned</option>
                  {subCategoriesList.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-ink-700 mb-1">Sleeve</label>
                <select
                  value={sleeve}
                  onChange={(e) => setSleeve(e.target.value)}
                  disabled={isEditing}
                  className="w-full px-3 py-2 bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold text-obsidian disabled:opacity-60"
                >
                  <option value="half">Half Sleeve</option>
                  <option value="full">Full Sleeve</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-ink-700 mb-1">Neck</label>
                <select
                  value={neck}
                  onChange={(e) => setNeck(e.target.value)}
                  disabled={isEditing}
                  className="w-full px-3 py-2 bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold text-obsidian disabled:opacity-60"
                >
                  <option value="round">Round Neck</option>
                  <option value="polo">Polo Collar</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Pricing & Commercials */}
          <div className="space-y-4">
            <h4 className="font-bold text-obsidian uppercase tracking-wider text-[11px] border-b border-sandstone pb-1">
              3. Pricing & Status
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block font-semibold text-ink-700 mb-1">
                  MRP (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value ? Number(e.target.value) : "")}
                  placeholder="1299"
                  required
                  min={1}
                  className="w-full px-3 py-2 bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold font-bold text-obsidian"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-700 mb-1">Compare-At (₹)</label>
                <input
                  type="number"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value ? Number(e.target.value) : "")}
                  placeholder="1599"
                  min={1}
                  className="w-full px-3 py-2 bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold text-ink-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-700 mb-1">Print / Weave Type</label>
                <input
                  type="text"
                  value={printType}
                  onChange={(e) => setPrintType(e.target.value)}
                  placeholder="Solid / Weave / Print"
                  disabled={isEditing}
                  className="w-full px-3 py-2 bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold text-obsidian disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold text-obsidian font-semibold"
                >
                  <option value="active">Active (Available for purchase)</option>
                  <option value="coming-soon">Coming Soon</option>
                  <option value="archived">Archived / Draft</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-ink-700 mb-1">Badges (comma separated)</label>
                <input
                  type="text"
                  value={badges}
                  onChange={(e) => setBadges(e.target.value)}
                  placeholder="Best Seller, Flagship, New Drop"
                  className="w-full px-3 py-2 bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold text-obsidian"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-700 mb-1">Highlights (comma separated)</label>
                <input
                  type="text"
                  value={highlights}
                  onChange={(e) => setHighlights(e.target.value)}
                  placeholder="Breathable Weave, Zero Shrinkage, Modern Contour"
                  className="w-full px-3 py-2 bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold text-obsidian"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-ink-700 mb-1">Garment Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Architectural luxury menswear description..."
                className="w-full px-3 py-2 bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold text-obsidian"
              />
            </div>
          </div>

          {/* Section: Variants & Inventory Stock (only for creation; edits handle via Inventory tab) */}
          {!isEditing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-sandstone pb-1">
                <h4 className="font-bold text-obsidian uppercase tracking-wider text-[11px]">
                  4. Colour Variants & Initial Inventory Stock (S, M, L, XL)
                </h4>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="btn-gold px-3 py-1 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Colourway</span>
                </button>
              </div>

              <div className="space-y-4">
                {variants.map((v, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-ivory/60 border border-sandstone rounded-xl space-y-3 relative"
                  >
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(idx)}
                        className="absolute right-3 top-3 p-1 text-red-500 hover:bg-red-50 rounded"
                        title="Remove Variant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-semibold text-ink-700 mb-1">Colour Name *</label>
                        <input
                          type="text"
                          value={v.colourName}
                          onChange={(e) => handleVariantChange(idx, "colourName", e.target.value)}
                          placeholder="e.g. Royal Emerald"
                          required
                          className="w-full px-2.5 py-1.5 bg-white border border-sandstone rounded focus:outline-none focus:border-gold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-ink-700 mb-1">Colour Slug</label>
                        <input
                          type="text"
                          value={v.colourSlug}
                          onChange={(e) => handleVariantChange(idx, "colourSlug", e.target.value)}
                          placeholder="royal-emerald"
                          className="w-full px-2.5 py-1.5 bg-white border border-sandstone rounded font-mono focus:outline-none focus:border-gold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-ink-700 mb-1">Hex Swatch *</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={v.hex}
                            onChange={(e) => handleVariantChange(idx, "hex", e.target.value)}
                            className="w-8 h-8 rounded border border-sandstone cursor-pointer"
                          />
                          <input
                            type="text"
                            value={v.hex}
                            onChange={(e) => handleVariantChange(idx, "hex", e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-sandstone rounded font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-ink-700 mb-1">Images (comma URLs)</label>
                        <input
                          type="text"
                          value={v.images}
                          onChange={(e) => handleVariantChange(idx, "images", e.target.value)}
                          placeholder="/products/1007/green.jpg"
                          className="w-full px-2.5 py-1.5 bg-white border border-sandstone rounded focus:outline-none focus:border-gold"
                        />
                      </div>
                    </div>

                    {/* Stock inputs per size */}
                    <div>
                      <span className="block font-semibold text-ink-700 mb-1.5">
                        Initial Stock Allocation (Quantity ≥ 0, default threshold: 3)
                      </span>
                      <div className="grid grid-cols-4 gap-3 bg-white p-2.5 rounded-lg border border-sandstone/80">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-ink-600 mb-0.5">Size S</label>
                          <input
                            type="number"
                            min={0}
                            value={v.stockS}
                            onChange={(e) => handleVariantChange(idx, "stockS", Number(e.target.value))}
                            className="w-full px-2 py-1 bg-ivory border border-sandstone rounded font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-ink-600 mb-0.5">Size M</label>
                          <input
                            type="number"
                            min={0}
                            value={v.stockM}
                            onChange={(e) => handleVariantChange(idx, "stockM", Number(e.target.value))}
                            className="w-full px-2 py-1 bg-ivory border border-sandstone rounded font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-ink-600 mb-0.5">Size L</label>
                          <input
                            type="number"
                            min={0}
                            value={v.stockL}
                            onChange={(e) => handleVariantChange(idx, "stockL", Number(e.target.value))}
                            className="w-full px-2 py-1 bg-ivory border border-sandstone rounded font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-ink-600 mb-0.5">Size XL</label>
                          <input
                            type="number"
                            min={0}
                            value={v.stockXL}
                            onChange={(e) => handleVariantChange(idx, "stockXL", Number(e.target.value))}
                            className="w-full px-2 py-1 bg-ivory border border-sandstone rounded font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-sandstone">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-ink-700 font-semibold hover:bg-sandstone/30 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="btn-gold px-6 py-2 font-bold uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? "Saving..." : isEditing ? "Update Garment" : "Create Garment"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
