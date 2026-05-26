import json
from pathlib import Path
from typing import Any, Dict, List, Optional

BASE_DIR = Path(r"c:\\Users\\nicol\\Projects\\DemaWebshop")
ANALYSIS_PATH = BASE_DIR / "dema-webshop" / "public" / "data" / "Product_pdfs_analysis_v2.json"
JSON_DIR = BASE_DIR / "dema-webshop" / "public" / "documents" / "Product_pdfs" / "json"


def load_analysis_index() -> Dict[str, Dict[str, Any]]:
    if not ANALYSIS_PATH.exists():
        raise FileNotFoundError(f"Analysis file not found: {ANALYSIS_PATH}")

    with ANALYSIS_PATH.open("r", encoding="utf-8") as f:
        data = json.load(f)

    index: Dict[str, Dict[str, Any]] = {}
    if isinstance(data, list):
        for item in data:
            if not isinstance(item, dict):
                continue
            sku = item.get("sku")
            if isinstance(sku, str) and sku.strip():
                index[sku.strip().upper()] = item
    return index


def merge_analysis_into_record(rec: Dict[str, Any], analysis_index: Dict[str, Dict[str, Any]]) -> None:
    sku_candidates: List[str] = []

    bestelnr = rec.get("bestelnr")
    if isinstance(bestelnr, str) and bestelnr.strip():
        sku_candidates.append(bestelnr.strip())

    ctx = rec.get("_context") or {}
    if isinstance(ctx, dict):
        ctx_bestelnr = ctx.get("bestelnr")
        if isinstance(ctx_bestelnr, str) and ctx_bestelnr.strip():
            sku_candidates.append(ctx_bestelnr.strip())

    sku_candidates = [c.upper() for c in sku_candidates if c]

    analysis_obj: Optional[Dict[str, Any]] = None
    for cand in sku_candidates:
        if cand in analysis_index:
            analysis_obj = analysis_index[cand]
            break

    if not analysis_obj:
        return

    enriched = rec.get("_enriched")
    if not isinstance(enriched, dict):
        enriched = {}
        rec["_enriched"] = enriched

    analysis_fields = {
        "product_category": analysis_obj.get("product_category"),
        "pressure_max_bar": analysis_obj.get("pressure_max_bar"),
        "dimensions_mm_list": analysis_obj.get("dimensions_mm_list"),
        "description": analysis_obj.get("description"),
        "source_pages": analysis_obj.get("source_pages"),
    }

    clean_analysis = {k: v for k, v in analysis_fields.items() if v is not None}
    if not clean_analysis:
        return

    existing = enriched.get("analysis")
    if isinstance(existing, dict):
        merged = {**existing, **clean_analysis}
    else:
        merged = clean_analysis

    enriched["analysis"] = merged


def process_json_file(path: Path, analysis_index: Dict[str, Dict[str, Any]]) -> None:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        return

    changed = False
    for rec in data:
        if not isinstance(rec, dict):
            continue
        before = json.dumps(rec, sort_keys=True, ensure_ascii=False)
        merge_analysis_into_record(rec, analysis_index)
        after = json.dumps(rec, sort_keys=True, ensure_ascii=False)
        if before != after:
            changed = True

    # Overwrite the existing JSON in place if anything changed
    if changed:
        with path.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  Updated {path.name}")
    else:
        print(f"  No analysis match for {path.name}; left unchanged")


def main() -> None:
    if not JSON_DIR.exists():
        print(f"JSON dir not found: {JSON_DIR}")
        return

    analysis_index = load_analysis_index()
    print(f"Loaded {len(analysis_index)} analysis entries from {ANALYSIS_PATH}")

    # Process all JSON files in the directory; they are expected to be the
    # current canonical per-PDF JSONs (already enriched or raw).
    json_files = sorted(
        p
        for p in JSON_DIR.glob("*.json")
        if p.is_file()
    )
    if not json_files:
        print(f"No JSON files in {JSON_DIR}")
        return

    total = len(json_files)
    processed = 0
    errors = 0

    for jf in json_files:
        print(f"Merging analysis into {jf.name}...")
        try:
            process_json_file(jf, analysis_index)
            processed += 1
        except Exception as exc:  # pragma: no cover - safety net
            errors += 1
            print(f"  ERROR merging analysis into {jf.name}: {exc}")

    print(f"Done. Files: total={total}, processed={processed}, errors={errors}")


if __name__ == "__main__":
    main()
