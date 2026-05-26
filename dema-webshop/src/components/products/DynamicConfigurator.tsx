"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types/product";

const EXCLUDE_KEYS = new Set<string>([
  // identifiers
  "sku",
  "name",
  "description",
  "product_category",
  // docs
  "pdf_source",
  "source_pages",
  // pricing/stock/meta
  "price",
  "inStock",
  "rating",
  "reviewCount",
  // arrays / complex often
  "connection_types",
  "flow_l_min_list",
  "dimensions_mm_list",
]);

// Preferably show these first if present (domain-friendly order)
const PREFERRED_ORDER = [
  "diameter",
  "diameter_mm",
  "size_inch",
  "width",
  "length_m",
  "color",
  "materials",
];

function normalizeKey(k: string) {
  return k.toLowerCase();
}

function titleize(k: string) {
  return k
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

type Selection = Record<string, string>;

export default function DynamicConfigurator({
  products,
  activeCategory,
  initialSelection,
}: {
  products: Product[];
  activeCategory?: string;
  initialSelection?: Record<string, string>;
}) {
  const router = useRouter();
  const [selection, setSelection] = useState<Selection>({});

  // Only consider products in active category
  const pool = useMemo(() => {
    return products.filter((p) =>
      activeCategory ? p.product_category === activeCategory : true
    );
  }, [products, activeCategory]);

  // Discover candidate attribute keys dynamically
  const attributeKeys = useMemo(() => {
    const counts: Record<string, Set<string>> = {};
    for (const p of pool) {
      for (const rawKey of Object.keys(p)) {
        const key = normalizeKey(rawKey);
        if (EXCLUDE_KEYS.has(key)) continue;
        const val = (p as any)[rawKey];
        // Only single scalar string/number/boolean values make sense for picklists
        if (
          val === null ||
          val === undefined ||
          Array.isArray(val) ||
          typeof val === "object"
        )
          continue;
        const str = String(val);
        if (!counts[key]) counts[key] = new Set<string>();
        counts[key].add(str);
      }
    }
    // Keep attributes with reasonable domain (2..20 unique values)
    const candidates = Object.entries(counts)
      .filter(([, set]) => set.size >= 2 && set.size <= 20)
      .map(([k]) => k);

    // Order with preferred first if present
    const preferred: string[] = [];
    const others: string[] = [];
    for (const k of candidates) {
      if (PREFERRED_ORDER.includes(k)) preferred.push(k);
      else preferred.push(
        ...([] as string[]).filter(() => false) // noop to satisfy TS
      );
    }
    // Use stable order by PREFERRED_ORDER, then alphabetically for the rest
    const sortedPreferred = PREFERRED_ORDER.filter((k) => candidates.includes(k));
    const remaining = candidates.filter((k) => !sortedPreferred.includes(k));
    remaining.sort();
    return [...sortedPreferred, ...remaining];
  }, [pool]);

  // Compute filtered subset based on current selections
  const filtered = useMemo(() => {
    return pool.filter((p) => {
      return Object.entries(selection).every(([k, v]) => {
        const val = (p as any)[k] ?? (p as any)[k.toLowerCase()];
        return String(val) === String(v);
      });
    });
  }, [pool, selection]);

  // For each attribute, compute available options given prior selections (cascading)
  const optionsByKey = useMemo(() => {
    const map: Record<string, { value: string; count: number }[]> = {};
    for (const key of attributeKeys) {
      // Build a subset filtered by all previous keys in order
      const idx = attributeKeys.indexOf(key);
      const priorKeys = attributeKeys.slice(0, idx);
      const subset = pool.filter((p) => {
        return priorKeys.every((pk) => {
          const sel = selection[pk];
          if (!sel) return true;
          const val = (p as any)[pk] ?? (p as any)[pk.toLowerCase()];
          return String(val) === String(sel);
        });
      });
      const counter = new Map<string, number>();
      for (const p of subset) {
        const val = (p as any)[key] ?? (p as any)[key.toLowerCase()];
        if (val !== undefined && val !== null) {
          const s = String(val);
          counter.set(s, (counter.get(s) || 0) + 1);
        }
      }
      const arr = Array.from(counter.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => a.value.localeCompare(b.value, undefined, { numeric: true }));
      map[key] = arr;
    }
    return map;
  }, [attributeKeys, pool, selection]);

  // When narrowed down to a single product, suggest SKU
  const uniqueProduct = filtered.length === 1 ? filtered[0] : undefined;

  // Reset selections when category changes
  useEffect(() => {
    setSelection({});
  }, [activeCategory]);

  // Apply initialSelection when available, trimming to known attributes and cascading order
  useEffect(() => {
    if (!initialSelection) return;
    const next: Selection = {};
    for (const key of attributeKeys) {
      const v = initialSelection[key] ?? initialSelection[key.toLowerCase()];
      if (v == null || v === '') continue;
      // Respect cascading: only set value if available in current options chain
      const idx = attributeKeys.indexOf(key);
      const priorKeys = attributeKeys.slice(0, idx);
      const subset = pool.filter((p) => {
        return priorKeys.every((pk) => {
          const sel = next[pk];
          if (!sel) return true;
          const val = (p as any)[pk] ?? (p as any)[pk.toLowerCase()];
          return String(val) === String(sel);
        });
      });
      const set = new Set<string>();
      for (const p of subset) {
        const val = (p as any)[key] ?? (p as any)[key.toLowerCase()];
        if (val !== undefined && val !== null) set.add(String(val));
      }
      if (set.has(String(v))) {
        next[key] = String(v);
      } else {
        // stop if the proposed value is not consistent with prior selections
        break;
      }
    }
    if (Object.keys(next).length) setSelection(next);
    // only run when attributeKeys/pool or initialSelection changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialSelection), pool, attributeKeys.join('|')]);

  if (!activeCategory || pool.length === 0 || attributeKeys.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 bg-gray-800 p-3 rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-200">Configure by attributes</h3>
        <span className="text-xs text-gray-400">{filtered.length} matches</span>
      </div>

      {attributeKeys.map((key) => (
        <div key={key} className="space-y-1">
          <label className="text-xs text-gray-400">{titleize(key)}</label>
          <select
            className="w-full rounded-md bg-gray-900 border border-gray-700 text-gray-100 text-sm p-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
            value={selection[key] || ""}
            onChange={(e) => {
              const val = e.target.value;
              setSelection((prev) => {
                const next = { ...prev } as Selection;
                if (val) next[key] = val; else delete next[key];
                // Drop selections for attributes that come after this one
                const idx = attributeKeys.indexOf(key);
                for (const k of attributeKeys.slice(idx + 1)) delete next[k];
                return next;
              });
            }}
          >
            <option value="">All</option>
            {optionsByKey[key]?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.value} ({opt.count})
              </option>
            ))}
          </select>
        </div>
      ))}

      {uniqueProduct ? (
        <button
          type="button"
          onClick={() => router.push(`/products/${uniqueProduct.sku}`)}
          className="w-full mt-2 px-3 py-2 bg-yellow-500 text-black rounded-md text-sm font-medium hover:bg-yellow-400"
        >
          View SKU {uniqueProduct.sku}
        </button>
      ) : null}
    </div>
  );
}
