import React, { useState, useEffect } from "react";
import { X, Check, AlertCircle, PackagePlus } from "lucide-react";
import { apiClient } from "../../api/client";
import { Product } from "../../types";

interface ReceiveStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReceiveStockModal: React.FC<ReceiveStockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedSize, setSelectedSize] = useState<"S" | "M" | "L" | "XL">("M");
  const [quantity, setQuantity] = useState<number>(10);
  const [referencePOId, setReferencePOId] = useState("");
  const [notes, setNotes] = useState("");

  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingProducts(true);
      setError(null);
      apiClient<{ items: Product[] }>("products?limit=100")
        .then((res) => {
          const list = res.items || [];
          setProducts(list);
          if (list.length > 0) {
            setSelectedProductId(list[0].id);
            if (list[0].variants && list[0].variants.length > 0) {
              setSelectedVariantId(list[0].variants[0].id);
            }
          }
        })
        .catch((err) => {
          setError(err.message || "Failed to load products list.");
        })
        .finally(() => {
          setIsLoadingProducts(false);
        });
    }
  }, [isOpen]);

  // Handle product selection change
  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod && prod.variants && prod.variants.length > 0) {
      setSelectedVariantId(prod.variants[0].id);
    } else {
      setSelectedVariantId("");
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const variantsList = selectedProduct?.variants || [];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariantId || quantity < 1) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient("admin/inventory/receive", {
        method: "POST",
        body: JSON.stringify({
          variantId: selectedVariantId,
          size: selectedSize,
          quantity: Number(quantity),
          referencePOId: referencePOId.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to receive stock shipment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-sandstone shadow-luxury p-6 max-w-md w-full space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-sandstone">
          <div className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-gold" />
            <h3 className="font-serif text-xl font-normal text-obsidian">Receive Stock Shipment</h3>
          </div>
          <button onClick={onClose} className="p-1 text-ink-500 hover:text-obsidian rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Select Garment */}
          <div>
            <label className="block font-semibold text-ink-700 mb-1">
              Select Garment Style *
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              disabled={isLoadingProducts}
              className="w-full px-3 py-2 bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold text-obsidian font-medium"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (P.NO: {p.pno})
                </option>
              ))}
            </select>
          </div>

          {/* Select Variant Colour */}
          <div>
            <label className="block font-semibold text-ink-700 mb-1">
              Select Variant Colourway *
            </label>
            <select
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(e.target.value)}
              className="w-full px-3 py-2 bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold text-obsidian font-medium"
            >
              {variantsList.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.colourName} ({v.sku})
                </option>
              ))}
            </select>
          </div>

          {/* Size & Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-700 mb-1">Garment Size *</label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value as any)}
                className="w-full px-3 py-2 bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold text-obsidian font-bold"
              >
                <option value="S">S (Small)</option>
                <option value="M">M (Medium)</option>
                <option value="L">L (Large)</option>
                <option value="XL">XL (Extra Large)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-ink-700 mb-1">Quantity Received (≥1) *</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
                className="w-full px-3 py-2 bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold font-bold text-obsidian"
              />
            </div>
          </div>

          {/* PO Reference */}
          <div>
            <label className="block font-semibold text-ink-700 mb-1">PO / Inward Batch Reference</label>
            <input
              type="text"
              value={referencePOId}
              onChange={(e) => setReferencePOId(e.target.value)}
              placeholder="e.g. PO-SURAT-2026-0042"
              className="w-full px-3 py-2 bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold font-mono text-obsidian"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-ink-700 mb-1">Receiving Audit Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ateevibes inspection passed, packed in master carton..."
              rows={2}
              className="w-full px-3 py-2 bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold text-obsidian"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-sandstone">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-ink-700 hover:bg-sandstone/30 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedVariantId || quantity < 1}
              className="btn-gold px-5 py-2 font-bold uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Receiving..." : "Inward Stock"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
