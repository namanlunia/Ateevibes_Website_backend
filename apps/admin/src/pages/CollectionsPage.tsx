import React, { useState, useEffect } from 'react';
import { Sparkles, Eye, EyeOff, Save, Check, RefreshCw } from 'lucide-react';
import { apiClient } from '../api/client';

export const CollectionsPage: React.FC = () => {
  const [hero, setHero] = useState({
    eyebrow: '2026 Small Batch Collection',
    headline: 'Modern Luxury in Motion',
    subheadline: 'Architectural knitwear and precision garment construction straight from Ateevibes Mumbai.',
    ctaText: 'Explore Collection',
    ctaLink: '/shop',
  });

  const [sections, setSections] = useState([
    { key: 'marquee', title: 'Ateevibes Statement Marquee', isVisible: true },
    { key: 'categories', title: 'Signature Fabric Weaves Grid', isVisible: true },
    { key: 'new-season', title: 'New Season Architectural Knits', isVisible: true },
    { key: 'same-print', title: 'Same Print Different Vibes Showcase', isVisible: true },
    { key: 'fabric-stories', title: 'Fabric Technology & Texture Stories', isVisible: true },
    { key: 'bestsellers', title: 'Community Best Sellers Carousel', isVisible: true },
    { key: 'value-props', title: 'Ateevibes Direct Value Propositions', isVisible: true },
    { key: 'vip-club', title: 'VIP Rotation Access Card', isVisible: true },
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    apiClient<{ hero?: any; sections?: any[] }>('homepage')
      .then((res) => {
        if (res?.hero) {
          setHero((prev) => ({ ...prev, ...res.hero }));
        }
      })
      .catch((err) => console.error('Failed to load homepage CMS:', err));
  }, []);

  const handleToggleSection = async (key: string) => {
    setSections((prev) =>
      prev.map((s) => (s.key === key ? { ...s, isVisible: !s.isVisible } : s)),
    );
  };

  const handleSaveCMS = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await apiClient('homepage/sections/hero', {
        method: 'PUT',
        body: JSON.stringify({
          title: 'Hero Campaign',
          isVisible: true,
          configJson: hero,
        }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-normal text-obsidian">Homepage Merchandising & CMS</h2>
          <p className="text-xs text-ink-600 mt-0.5">Control editorial hero copy, campaign banners, and storefront section sequencing</p>
        </div>

        <button
          onClick={handleSaveCMS}
          disabled={isSaving}
          className="btn-gold px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-luxury"
        >
          {saveSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-950" />
              <span>Published to Storefront</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save & Publish'}</span>
            </>
          )}
        </button>
      </div>

      {/* Hero Banner CMS */}
      <div className="p-6 rounded-2xl bg-white border border-sandstone shadow-subtle space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-sandstone">
          <Sparkles className="w-4 h-4 text-gold" />
          <h3 className="font-serif text-xl font-normal text-obsidian">Editorial Hero Campaign</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-1">
              Eyebrow Accent Label
            </label>
            <input
              type="text"
              value={hero.eyebrow}
              onChange={(e) => setHero({ ...hero, eyebrow: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-1">
              Primary Headline (Serif)
            </label>
            <input
              type="text"
              value={hero.headline}
              onChange={(e) => setHero({ ...hero, headline: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold font-serif text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-1">
              Supporting Subheadline
            </label>
            <textarea
              value={hero.subheadline}
              onChange={(e) => setHero({ ...hero, subheadline: e.target.value })}
              rows={2}
              className="w-full px-3.5 py-2 text-xs bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-1">
              CTA Button Label
            </label>
            <input
              type="text"
              value={hero.ctaText}
              onChange={(e) => setHero({ ...hero, ctaText: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-1">
              CTA Target Link
            </label>
            <input
              type="text"
              value={hero.ctaLink}
              onChange={(e) => setHero({ ...hero, ctaLink: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold font-mono"
            />
          </div>
        </div>
      </div>

      {/* Section Visibility Toggles */}
      <div className="p-6 rounded-2xl bg-white border border-sandstone shadow-subtle space-y-4">
        <div className="pb-3 border-b border-sandstone">
          <h3 className="font-serif text-xl font-normal text-obsidian">Homepage Section Visibility</h3>
          <p className="text-xs text-ink-600">Activate or temporarily pause editorial modules on the customer storefront</p>
        </div>

        <div className="divide-y divide-sandstone/40">
          {sections.map((section) => (
            <div key={section.key} className="py-3.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-obsidian">{section.title}</p>
                <p className="text-[11px] font-mono text-ink-500">Key: {section.key}</p>
              </div>

              <button
                onClick={() => handleToggleSection(section.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  section.isVisible
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-sandstone/30 text-ink-600 border border-sandstone'
                }`}
              >
                {section.isVisible ? (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visible</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hidden</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
