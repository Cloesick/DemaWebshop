import json
import re
from dataclasses import dataclass, asdict
from hashlib import md5
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


BASE_JSON_DIR = Path(r"c:\\Users\\nicol\\Projects\\DemaWebshop\\dema-webshop\\public\\documents\\Product_pdfs\\json")


@dataclass
class EnrichedContext:
    series_raw: Optional[str]
    series: Optional[str]
    catalog_group: Optional[str]
    product_type: Optional[str]
    material: Optional[str]
    family_id: Optional[str]
    sku_series: Optional[str]


def slugify(text: Optional[str]) -> Optional[str]:
    if text is None:
        return None


def normalize_checkmarks(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {k: normalize_checkmarks(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [normalize_checkmarks(v) for v in obj]
    # convert the checkmark symbol to "yes"
    if isinstance(obj, str) and obj == "":
        return "yes"
    return obj


def enrich_airpress_specific(rec: Dict[str, Any], enriched_ctx: Dict[str, Any]) -> None:
    """Add Airpress-specific semantic fields based on codes and numeric columns.

    Examples we handle:
    - Codes like 'HL 150-24' or 'hl_150_24' → series, intake (L/min), tank volume (L).
    - Bar fields like '6 bar', '8 bar' → pressure_min_bar, pressure_max_bar.
    - Two L/min fields in the same row → smaller = output, larger = intake.
    """

    ctx = rec.get("_context") or {}
    source_pdf = str(ctx.get("source_pdf") or "").lower()
    if "airpress" not in source_pdf:
        return

    # --- Parse model / code pattern: series + intake + tank volume ---
    series = None
    intake = None
    volume = None

    # Look at obvious fields that may contain codes
    code_candidates: List[str] = []
    for key in ["hl_150_24", "code", "model", "type"]:
        v = rec.get(key)
        if isinstance(v, str) and v.strip():
            code_candidates.append(v.strip())

    code_text = " ".join(code_candidates)
    m = re.search(r"\b([a-zA-Z]{1,4})[ _]?([0-9]{2,4})[-_/ ]([0-9]{1,4})\b", code_text)
    if m:
        series = m.group(1).lower()
        try:
            intake = float(m.group(2))
        except ValueError:
            intake = None
        try:
            volume = float(m.group(3))
        except ValueError:
            volume = None

    # --- Parse bar fields: min/max working pressure ---
    pressures: List[float] = []
    for k, v in rec.items():
        if not isinstance(v, str):
            continue
        if "bar" in v.lower():
            num_match = re.search(r"([0-9]+(?:,[0-9]+)?)", v)
            if num_match:
                try:
                    pressures.append(float(num_match.group(1).replace(",", ".")))
                except ValueError:
                    pass

    pressure_min = min(pressures) if pressures else None
    pressure_max = max(pressures) if pressures else None

    # --- Parse L/min fields: smaller = output, larger = intake ---
    flows: List[float] = []
    for k, v in rec.items():
        if not isinstance(v, str):
            continue
        if "l/min" in v.lower():
            num_match = re.search(r"([0-9]+(?:,[0-9]+)?)", v)
            if num_match:
                try:
                    flows.append(float(num_match.group(1).replace(",", ".")))
                except ValueError:
                    pass

    flow_output = None
    flow_intake = None
    if flows:
        flows_sorted = sorted(flows)
        flow_output = flows_sorted[0]
        flow_intake = flows_sorted[-1]

    # Store under a dedicated key inside _enriched
    airpress_data: Dict[str, Any] = {}

    # Series / intake / tank volume from code
    if series is not None:
        airpress_data["compressor_series"] = series
    if intake is not None:
        airpress_data["intake_l_min_from_code"] = intake
    if volume is not None:
        airpress_data["tank_volume_l_from_code"] = volume

    # Working pressure range
    if pressure_min is not None:
        airpress_data["pressure_min_bar"] = pressure_min
    if pressure_max is not None:
        airpress_data["pressure_max_bar"] = pressure_max

    # Flow rates: smaller = output, larger = intake
    if flow_output is not None:
        airpress_data["flow_output_l_min"] = flow_output
    if flow_intake is not None:
        airpress_data["flow_intake_l_min"] = flow_intake

    # SKU: fields like '36744_e' hold the order number / SKU
    for k, v in rec.items():
        if not isinstance(k, str) or not isinstance(v, str):
            continue
        # Match patterns like '36744_e', '12345', etc.
        if re.fullmatch(r"[0-9]+[_a-zA-Z]*", k) and v.strip():
            airpress_data.setdefault("sku", v.strip())
            break

    # RPM: e.g. '2850 rpm'
    for k, v in rec.items():
        if not isinstance(v, str):
            continue
        if "rpm" in v.lower():
            m_rpm = re.search(r"([0-9]+)", v)
            if m_rpm:
                try:
                    airpress_data.setdefault("rpm", int(m_rpm.group(1)))
                except ValueError:
                    pass
            break

    # Noise level: e.g. '93 dB(A)'
    for k, v in rec.items():
        if not isinstance(v, str):
            continue
        if "db" in v.lower():
            m_db = re.search(r"([0-9]+(?:,[0-9]+)?)", v)
            if m_db:
                try:
                    airpress_data.setdefault("noise_db_a", float(m_db.group(1).replace(",", ".")))
                except ValueError:
                    pass
            break

    # Dimensions: e.g. '600 x 330 x 560 mm' or '580*255*580 mm'
    for k, v in rec.items():
        if not isinstance(v, str):
            continue
        if "mm" in v.lower() and ("x" in v or "*" in v):
            # Extract up to three numeric components
            nums = re.findall(r"[0-9]+(?:,[0-9]+)?", v)
            dims: List[float] = []
            for n in nums[:3]:
                try:
                    dims.append(float(n.replace(",", ".")))
                except ValueError:
                    pass
            if dims:
                airpress_data.setdefault("dimensions_mm", dims)
            break

    # Weight: values like '27 kg', possibly multiple per row
    weights: List[float] = []
    for k, v in rec.items():
        if not isinstance(v, str):
            continue
        if "kg" in v.lower():
            m_kg = re.search(r"([0-9]+(?:,[0-9]+)?)", v)
            if m_kg:
                try:
                    weights.append(float(m_kg.group(1).replace(",", ".")))
                except ValueError:
                    pass
    if weights:
        w_min = min(weights)
        w_max = max(weights)
        airpress_data.setdefault("weight_empty_kg", w_min)
        airpress_data.setdefault("weight_full_kg", w_max)

    if airpress_data:
        enriched_ctx["airpress"] = airpress_data


def detect_catalog_group(source_pdf: str) -> Optional[str]:
    n = source_pdf.lower()
    if "abs-persluchtbuizen" in n:
        return "compressed_air"
    if "bronpompen" in n:
        return "well_pumps"
    if "centrifugaalpompen" in n:
        return "centrifugal_pumps"
    if "dompelpompen" in n:
        return "submersible_pumps"
    if "aandrijftechniek" in n:
        return "drive_technology"
    if "kranzle" in n:
        return "pressure_washers"
    if "drukbuizen" in n or "kunststof-afvoerleidingen" in n:
        return "plastic_pipes"
    return None


def detect_product_type(source_pdf: str, category: Optional[str], record: Dict[str, Any]) -> Optional[str]:
    n = source_pdf.lower()
    cat = (category or "").lower()

    if "abs-persluchtbuizen" in n:
        return "compressed_air_pipe"
    if "bronpompen" in n:
        return "well_pump"
    if "centrifugaalpompen" in n:
        return "centrifugal_pump"
    if "dompelpompen" in n:
        # Rough heuristic: large grain size → sewage pump
        kg = str(record.get("korrelgrootte") or "").lower()
        if any(x in kg for x in ["50", "60", "70"]):
            return "sewage_submersible_pump"
        return "submersible_pump"
    if "aandrijftechniek" in n:
        return "drive_bearing"
    if "kranzle" in n:
        return "pressure_washer"
    if "drukbuizen" in n or "kunststof-afvoerleidingen" in n:
        return "plastic_pipe"

    # Fallback: try some keywords in category
    if "pomp" in cat:
        return "pump"
    if "buis" in cat or "leiding" in cat:
        return "pipe"

    return None


def detect_material(source_pdf: str, category: Optional[str]) -> Optional[str]:
    n = source_pdf.lower()
    cat = (category or "").lower()

    if "abs-persluchtbuizen" in n:
        return "ABS"
    if "drukbuizen" in n or "kunststof-afvoerleidingen" in n:
        # Could refine later if needed
        if "pp" in cat:
            return "PP"
        if "pvc" in cat:
            return "PVC"
        return "PVC"
    if "aandrijftechniek" in n:
        # Bearings typically steel
        return "steel"
    if "kranzle" in n:
        return None
    if "bronpompen" in n or "centrifugaalpompen" in n or "dompelpompen" in n:
        # Pumps: mixed materials, leave unspecified for now
        return None

    # Keyword-based overrides from category
    if "rvs" in cat:
        return "stainless_steel"
    if "staal" in cat:
        return "steel"

    return None


def detect_sku_series(record: Dict[str, Any]) -> Optional[str]:
    """Extract a SKU series prefix like 'absbu' from values such as 'ABSBU016'.

    Strategy:
    - Prefer bestelnr, then code, then model, then type.
    - Take leading letters up to first digit, normalize to lowercase.
    """

    candidates: List[str] = []
    for key in ["bestelnr", "code", "model", "type"]:
        v = record.get(key)
        if isinstance(v, str) and v.strip():
            candidates.append(v.strip())

    for raw in candidates:
        token = raw.split()[0]
        m = re.match(r"([A-Za-z]+)[0-9].*", token)
        if m:
            return m.group(1).lower()

    return None


def build_family_id(
    catalog_group: Optional[str],
    product_type: Optional[str],
    series: Optional[str],
    record: Dict[str, Any],
) -> Optional[str]:
    """Build a readable slug family_id based on domain-specific keys.

    The goal is stable grouping of "siblings" while being human-friendly.
    """
    if not product_type:
        return None

    key_parts: List[str] = []
    if catalog_group:
        key_parts.append(catalog_group)
    key_parts.append(product_type)
    if series:
        key_parts.append(series)

    # Domain-specific fields
    if catalog_group in {"compressed_air", "plastic_pipes"}:
        # Pipes: group by size and wall thickness
        maat = str(record.get("maat") or "").strip()
        wand = str(record.get("wanddikte") or "").strip()
        if maat:
            key_parts.append(maat)
        if wand:
            key_parts.append(f"wd-{wand}")

    elif catalog_group in {"well_pumps", "centrifugal_pumps", "submersible_pumps"}:
        t = str(record.get("type") or "").strip()
        vermogen = str(record.get("vermogen_kw") or "").strip()
        if t:
            key_parts.append(t)
        if vermogen:
            key_parts.append(f"p-{vermogen}")

    elif catalog_group == "drive_technology":
        code = str(record.get("code") or "").strip()
        binnendia = str(record.get("binnendiameter_mm") or "").strip()
        buitendia = str(record.get("buitendiameter_mm") or "").strip()
        if code:
            key_parts.append(code)
        if binnendia and buitendia:
            key_parts.append(f"{binnendia}x{buitendia}")

    elif catalog_group == "pressure_washers":
        model = str(record.get("model") or record.get("type") or "").strip()
        if model:
            key_parts.append(model)

    # Fallback: include bestelnr prefix to avoid collisions while staying readable
    bestelnr = str(record.get("bestelnr") or "").strip()
    if bestelnr:
        key_parts.append(bestelnr.split(" ")[0])

    base = "-".join(slugify(p) or "x" for p in key_parts if p)
    if not base:
        return None

    # Also append short hash to avoid accidental collisions while staying readable
    digest = md5("|".join(key_parts).encode("utf-8")).hexdigest()[:6]
    return f"{base}-{digest}"


def enrich_record(rec: Dict[str, Any]) -> Dict[str, Any]:
    ctx = rec.get("_context") or {}
    source_pdf = str(ctx.get("source_pdf") or "")
    category = ctx.get("category")

    series_raw = category
    series = slugify(category) if category else None
    catalog_group = detect_catalog_group(source_pdf)
    product_type = detect_product_type(source_pdf, category, rec)
    material = detect_material(source_pdf, category)
    family_id = build_family_id(catalog_group, product_type, series, rec)
    sku_series = detect_sku_series(rec)

    # For ABS / plastic pipes, interpret 'maat' in mm as tube diameter
    # and values like '5 m' / columns like '5_m' as product length in meters.
    diameter_mm: Optional[float] = None
    length_m: Optional[float] = None
    if catalog_group in {"compressed_air", "plastic_pipes"}:
        maat_val = rec.get("maat")
        if isinstance(maat_val, str):
            m = re.search(r"([0-9]+(?:,[0-9]+)?)\s*mm", maat_val.lower())
            if m:
                try:
                    diameter_mm = float(m.group(1).replace(",", "."))
                except ValueError:
                    diameter_mm = None

        # Prefer explicit 'lengte' field if present
        lengte_val = rec.get("lengte")
        if isinstance(lengte_val, str):
            m_len = re.search(r"([0-9]+(?:,[0-9]+)?)\s*m\b", lengte_val.lower())
            if m_len:
                try:
                    length_m = float(m_len.group(1).replace(",", "."))
                except ValueError:
                    length_m = None

        # Fallback: scan other keys that look like length columns, e.g. '5_m'
        if length_m is None:
            for k, v in rec.items():
                if not isinstance(v, str):
                    continue
                if not isinstance(k, str):
                    continue
                if k.endswith("_m") or "lengte" in k.lower():
                    m_len = re.search(r"([0-9]+(?:,[0-9]+)?)\s*m\b", v.lower())
                    if m_len:
                        try:
                            length_m = float(m_len.group(1).replace(",", "."))
                            break
                        except ValueError:
                            length_m = None

    enriched_ctx = EnrichedContext(
        series_raw=series_raw,
        series=series,
        catalog_group=catalog_group,
        product_type=product_type,
        material=material,
        family_id=family_id,
        sku_series=sku_series,
    )

    # Convert dataclass to dict, then attach diameter/length if present, then apply Airpress-specific enrichment
    enriched_dict = asdict(enriched_ctx)
    if diameter_mm is not None:
        enriched_dict["diameter_mm"] = diameter_mm
    if length_m is not None:
        enriched_dict["length_m"] = length_m
    enrich_airpress_specific(rec, enriched_dict)

    # Attach under a dedicated key to avoid clobbering existing fields
    rec["_enriched"] = enriched_dict
    return rec


def enrich_records_list(records: List[Any]) -> Tuple[List[Dict[str, Any]], int]:
    """Enrich a list of records, returning enriched list and count."""
    enriched: List[Dict[str, Any]] = []
    count = 0
    for rec in records:
        if isinstance(rec, dict):
            enriched.append(enrich_record(rec))
            count += 1
        else:
            enriched.append(rec)
    return enriched, count


def enrich_nested_structure(data: Any) -> Tuple[Any, int]:
    """Recursively enrich nested structures (dicts with variations/products/items)."""
    total_count = 0
    
    if isinstance(data, list):
        enriched, count = enrich_records_list(data)
        return enriched, count
    
    if isinstance(data, dict):
        result = {}
        for key, value in data.items():
            if key in ("variations", "products", "items", "models") and isinstance(value, list):
                # Enrich list of records
                enriched_list, count = enrich_records_list(value)
                result[key] = enriched_list
                total_count += count
            elif isinstance(value, dict):
                # Recurse into nested dicts (e.g., product_groups, series)
                enriched_value, count = enrich_nested_structure(value)
                result[key] = enriched_value
                total_count += count
            elif isinstance(value, list) and value and isinstance(value[0], dict):
                # List of dicts that might contain nested structures
                enriched_list = []
                for item in value:
                    if isinstance(item, dict):
                        enriched_item, count = enrich_nested_structure(item)
                        enriched_list.append(enriched_item)
                        total_count += count
                    else:
                        enriched_list.append(item)
                result[key] = enriched_list
            else:
                result[key] = value
        return result, total_count
    
    return data, 0


def process_json_file(path: Path) -> bool:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    data = normalize_checkmarks(data)

    if isinstance(data, list):
        # Simple flat list of records
        enriched, count = enrich_records_list(data)
        output_data = enriched
    elif isinstance(data, dict):
        # Nested structure (catalog with variations, product_groups, etc.)
        enriched_data, count = enrich_nested_structure(data)
        output_data = enriched_data
    else:
        print(f"  Skipped {path.name}: unexpected JSON structure")
        return False

    # Overwrite the original JSON file with the enriched data
    out_path = path

    with out_path.open("w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"  Processed {count} records")
    print(f"  Wrote {out_path}")
    return True


def main() -> None:
    if not BASE_JSON_DIR.exists():
        print(f"JSON dir not found: {BASE_JSON_DIR}")
        return

    json_files = sorted(p for p in BASE_JSON_DIR.glob("*.json") if p.is_file())
    if not json_files:
        print(f"No JSON files in {BASE_JSON_DIR}")
        return

    total = len(json_files)
    processed = 0
    errors = 0

    for jf in json_files:
        print(f"Enriching {jf.name}...")
        try:
            changed = process_json_file(jf)
            if changed:
                processed += 1
        except Exception as exc:  # pragma: no cover - safety net
            errors += 1
            print(f"  ERROR enriching {jf.name}: {exc}")

    print(f"Done. Files: total={total}, processed={processed}, errors={errors}")


if __name__ == "__main__":
    main()
