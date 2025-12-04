import argparse
import json
import re
from dataclasses import dataclass, asdict
from hashlib import md5
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple

import pdfplumber


# ------------------------
# Generic helpers
# ------------------------

HeaderRow = List[Optional[str]]
DataRow = List[Optional[str]]


@dataclass
class RowContext:
    source_pdf: str
    page_number: int
    category: Optional[str]


# ------------------------
# Enrichment helpers (inlined from previous enrich_product_json)
# ------------------------


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
    t = text.strip().lower()
    t = re.sub(r"/", " ", t)
    t = re.sub(r"[^a-z0-9]+", "-", t)
    t = re.sub(r"-+", "-", t).strip("-")
    return t or None

def enrich_makita_specific(rec: Dict[str, Any], enriched_ctx: Dict[str, Any]) -> None:
    ctx = rec.get("_context") or {}
    source_pdf = str(ctx.get("source_pdf") or "").lower()
    if "makita" not in source_pdf:
        return

    makita_ranges: List[Dict[str, Any]] = []
    pattern = re.compile(r"^(\d+)_v_(\d+)vmax_(\d+)_(\d+)_nm$")

    for key, value in rec.items():
        if not isinstance(key, str) or not isinstance(value, str):
            continue
        if value != "yes":
            continue

        m = pattern.match(key)
        if not m:
            continue

        try:
            v_min = int(m.group(1))
            v_max = int(m.group(2))
            t_min = int(m.group(3))
            t_max = int(m.group(4))
        except ValueError:
            continue

        makita_ranges.append(
            {
                "key": key,
                "voltage": {"min_v": v_min, "max_v": v_max},
                "torque": {"min_nm": t_min, "max_nm": t_max},
                "available": "yes",
            }
        )

    if makita_ranges:
        enriched_ctx["makita_ranges"] = makita_ranges
        
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
        if "pp" in cat:
            return "PP"
        if "pvc" in cat:
            return "PVC"
        return "PVC"
    if "aandrijftechniek" in n:
        return "steel"
    if "kranzle" in n:
        return None
    if "bronpompen" in n or "centrifugaalpompen" in n or "dompelpompen" in n:
        return None

    if "rvs" in cat:
        return "stainless_steel"
    if "staal" in cat:
        return "steel"

    return None


def detect_sku_series(record: Dict[str, Any]) -> Optional[str]:
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


def enrich_airpress_specific(rec: Dict[str, Any], enriched_ctx: Dict[str, Any]) -> None:
    ctx = rec.get("_context") or {}
    source_pdf = str(ctx.get("source_pdf") or "").lower()
    if "airpress" not in source_pdf:
        return

    series = None
    intake = None
    volume = None

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

    pressures: List[float] = []
    for _, v in rec.items():
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

    flows: List[float] = []
    for _, v in rec.items():
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

    airpress_data: Dict[str, Any] = {}

    if series is not None:
        airpress_data["compressor_series"] = series
    if intake is not None:
        airpress_data["intake_l_min_from_code"] = intake
    if volume is not None:
        airpress_data["tank_volume_l_from_code"] = volume

    if pressure_min is not None:
        airpress_data["pressure_min_bar"] = pressure_min
    if pressure_max is not None:
        airpress_data["pressure_max_bar"] = pressure_max

    if flow_output is not None:
        airpress_data["flow_output_l_min"] = flow_output
    if flow_intake is not None:
        airpress_data["flow_intake_l_min"] = flow_intake

    for k, v in rec.items():
        if not isinstance(k, str) or not isinstance(v, str):
            continue
        if re.fullmatch(r"[0-9]+[_a-zA-Z]*", k) and v.strip():
            airpress_data.setdefault("sku", v.strip())
            break

    for _, v in rec.items():
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

    for _, v in rec.items():
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

    for _, v in rec.items():
        if not isinstance(v, str):
            continue
        if "mm" in v.lower() and ("x" in v or "*" in v):
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

    weights: List[float] = []
    for _, v in rec.items():
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


def enrich_bronpompen(rec: Dict[str, Any], enriched_ctx: Dict[str, Any]) -> None:
    ctx = rec.get("_context") or {}
    source_pdf = str(ctx.get("source_pdf") or "").lower()
    if "bronpompen" not in source_pdf:
        return

    variation: Dict[str, Any] = {}

    variation["type"] = rec.get("type")
    variation["nominal_diameter_inch"] = "3"

    motors: Dict[str, Any] = {}
    mv_230 = rec.get("motor_voltage_230")
    mv_400 = rec.get("motor_voltage_400")
    if mv_230:
        motors["3x230V"] = mv_230
    if mv_400:
        motors["3x400V"] = mv_400
    if motors:
        variation["motors"] = motors

    def to_float(val: Any) -> Optional[float]:
        if isinstance(val, str):
            try:
                return float(val.replace(",", "."))
            except ValueError:
                return None
        if isinstance(val, (int, float)):
            return float(val)
        return None

    variation["power_kw"] = to_float(rec.get("vermogen_kw"))
    variation["flow_rate_m3h"] = to_float(rec.get("debiet_m3_h"))
    variation["head_m"] = to_float(rec.get("opvoerhoogte_m"))

    conn = rec.get("aan_sluiting") or rec.get("aansluiting")
    if isinstance(conn, str):
        variation["connection_inch"] = conn.replace("\"", "").replace("”", "").strip()

    pump_dia = rec.get("pomp_dia_mm")
    if isinstance(pump_dia, str):
        m = re.search(r"([0-9]+(?:,[0-9]+)?)", pump_dia)
        if m:
            try:
                variation["pump_diameter_mm"] = float(m.group(1).replace(",", "."))
            except ValueError:
                pass

    enriched_ctx["bronpomp_variation"] = variation


def enrich_drive_technology(rec: Dict[str, Any], enriched_ctx: Dict[str, Any]) -> None:
    """Attach a lagerblok variation object for drive-technology bearing blocks.

    Target shape matches the provided product_series.variations example,
    as far as fields are available in the extracted JSON.
    """

    ctx = rec.get("_context") or {}
    source_pdf = str(ctx.get("source_pdf") or "").lower()
    if "catalogus-aandrijftechniek" not in source_pdf:
        return

    variation: Dict[str, Any] = {}

    # Inner diameter (bore) in mm
    inner_dia = rec.get("binnendiameter_mm")
    if isinstance(inner_dia, str) and inner_dia.strip():
        try:
            variation["inner_diameter_mm"] = float(inner_dia.replace(",", "."))
        except ValueError:
            pass

    # Housing unit, e.g. from 'lagerhuis_p204' column
    housing_unit = None
    for k, v in rec.items():
        if not isinstance(k, str):
            continue
        if not isinstance(v, str):
            continue
        if k.startswith("lagerhuis") and v.strip():
            housing_unit = v.strip()
            break
    if housing_unit is not None:
        variation["housing_unit"] = housing_unit

    # Insert bearing code, look for UC* style codes if present
    insert_bearing = None
    for k, v in rec.items():
        if not isinstance(v, str):
            continue
        if re.search(r"\bUC[0-9]{3}.*", v):
            insert_bearing = v.strip()
            break
    if insert_bearing is not None:
        variation["insert_bearing"] = insert_bearing

    # Product code: if we ever add a code/SKU field for this table, surface it here.
    # For now, derive a simple code from housing_unit + inner diameter if both exist.
    if housing_unit is not None and "inner_diameter_mm" in variation:
        variation["product_code"] = f"{housing_unit}-{int(variation['inner_diameter_mm'])}"

    if variation:
        enriched_ctx["lagerblok_variation"] = variation


def enrich_black_fittings(rec: Dict[str, Any], enriched_ctx: Dict[str, Any]) -> None:
    """Decode zwarte-draad-en-lasfittingen SKU keys like 7ZF9012.

    Example: 7ZF9012 -> angle 90 deg, size_code "12" which corresponds
    to 1/2" from the size column.
    """

    ctx = rec.get("_context") or {}
    source_pdf = str(ctx.get("source_pdf") or "").lower()
    if "zwarte-draad-en-lasfittingen" not in source_pdf:
        return

    sku_key: Optional[str] = None
    for k in rec.keys():
        if not isinstance(k, str):
            continue
        # Heuristic: these keys are all starting with '7' and then letters/digits
        if re.fullmatch(r"7[0-9A-Za-z]+", k):
            sku_key = k
            break

    if not sku_key:
        return

    sku = sku_key.upper()

    angle_deg: Optional[int] = None
    m_angle = re.search(r"(45|90|180)", sku)
    if m_angle:
        try:
            angle_deg = int(m_angle.group(1))
        except ValueError:
            angle_deg = None

    size_code: Optional[str] = None
    m_code = re.search(r"(\d{2})$", sku)
    if m_code:
        size_code = m_code.group(1)

    size_inch: Optional[str] = None
    # Prefer explicit size text from maat/maten columns, e.g. 1/2" or 2 1/2".
    for k, v in rec.items():
        if not isinstance(k, str) or not isinstance(v, str):
            continue
        key = k.lower()
        if "maat" in key or "maten" in key:
            txt = v.strip()
            if txt:
                size_inch = txt
                size_inch_value = parse_inch_size(txt)
                break

    black_fitting: Dict[str, Any] = {}
    black_fitting["sku_key"] = sku_key
    if angle_deg is not None:
        black_fitting["angle_deg"] = angle_deg
    if size_code is not None:
        black_fitting["size_code"] = size_code
    if size_inch is not None:
        black_fitting["size_inch"] = size_inch

    if black_fitting:
        enriched_ctx["black_fitting"] = black_fitting


def enrich_galvanized_pipes(rec: Dict[str, Any], enriched_ctx: Dict[str, Any]) -> None:
    """Enrich verzinkte-buizen rows with decoded SKU and dimensions.

    Examples:
    - Header/column codes like GB38 or ZF118 map to SKUs, while the actual
      inch size is given in maat_* columns (e.g. 3/8", 1/8").
    """

    ctx = rec.get("_context") or {}
    source_pdf = str(ctx.get("source_pdf") or "").lower()
    if "verzinkte-buizen" not in source_pdf:
        return

    # SKU code: look for cell values like GB34, GB2, ZF118, etc.
    sku_code: Optional[str] = None
    for k, v in rec.items():
        if not isinstance(v, str):
            continue
        if re.fullmatch(r"[A-Za-z]{2,4}[0-9]{1,4}", v.strip()):
            sku_code = v.strip().upper()
            break

    # If not found in values, fall back to header-like keys such as gb38.
    if not sku_code:
        for k in rec.keys():
            if not isinstance(k, str):
                continue
            if re.fullmatch(r"[a-z]{2,4}[0-9]{1,4}", k):
                sku_code = k.upper()
                break

    # Size in inches from maat_* columns, e.g. 3/8", 1/2", 2 1/2".
    size_inch: Optional[str] = None
    size_inch_value: Optional[float] = None
    for k, v in rec.items():
        if not isinstance(k, str) or not isinstance(v, str):
            continue
        if "maat" in k.lower():
            txt = v.strip()
            if txt:
                size_inch = txt
                break

    # Wall thickness in mm from wanddikte_*_mm if present.
    wall_thickness_mm: Optional[float] = None
    for k, v in rec.items():
        if not isinstance(k, str) or not isinstance(v, str):
            continue
        if "wanddikte" in k.lower():
            m = re.search(r"([0-9]+(?:,[0-9]+)?)", v)
            if m:
                try:
                    wall_thickness_mm = float(m.group(1).replace(",", "."))
                except ValueError:
                    wall_thickness_mm = None
            break

    # Length in meters from *_m fields like 6_m = "6 m".
    length_m: Optional[float] = None
    for k, v in rec.items():
        if not isinstance(k, str) or not isinstance(v, str):
            continue
        if k.endswith("_m"):
            m = re.search(r"([0-9]+(?:,[0-9]+)?)\s*m\b", v.lower())
            if m:
                try:
                    length_m = float(m.group(1).replace(",", "."))
                except ValueError:
                    length_m = None
            break

    # For threaded nipples etc., there are columns like 40_mm with the
    # actual physical length.
    length_mm: Optional[float] = None
    for k, v in rec.items():
        if not isinstance(k, str) or not isinstance(v, str):
            continue
        if k.lower().endswith("_mm") and "wanddikte" not in k.lower():
            m = re.search(r"([0-9]+(?:,[0-9]+)?)", v)
            if m:
                try:
                    length_mm = float(m.group(1).replace(",", "."))
                except ValueError:
                    length_mm = None
            break

    galvanized: Dict[str, Any] = {}
    if sku_code:
        galvanized["sku_code"] = sku_code
    if size_inch:
        galvanized["size_inch"] = size_inch
    if size_inch_value is not None:
        galvanized["size_inch_value"] = size_inch_value
    if wall_thickness_mm is not None:
        galvanized["wall_thickness_mm"] = wall_thickness_mm
    if length_m is not None:
        galvanized["length_m"] = length_m
    if length_mm is not None:
        galvanized["length_mm"] = length_mm

    if galvanized:
        enriched_ctx["galvanized_piece"] = galvanized


def enrich_airpress_nl_fr(rec: Dict[str, Any], enriched_ctx: Dict[str, Any]) -> None:
    """Parse section-level metadata from Airpress NL-FR catalog text blocks.

    We extract:
    - page_ref: numeric page reference in the text (e.g. 23, 26)
    - titles_line: first non-empty, non-numeric line (multi-language title)
    - series_line: last non-empty, non-numeric line (multi-language series description)
    - series_code: single-letter series identifier from series_line (e.g. G, K)
    """

    ctx = rec.get("_context") or {}
    source_pdf = str(ctx.get("source_pdf") or "").lower()
    if "airpress-catalogus-nl-fr" not in source_pdf:
        return

    text: Optional[str] = None
    for k, v in rec.items():
        if not isinstance(k, str):
            continue
        if k.startswith("zuigercompressoren_") and isinstance(v, str) and v.strip():
            text = v
            break

    if not text:
        return

    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]

    page_ref: Optional[int] = None
    titles_line: Optional[str] = None
    series_line: Optional[str] = None

    # Detect page_ref as the first line that is purely numeric
    for ln in lines:
        if re.fullmatch(r"\d+", ln):
            try:
                page_ref = int(ln)
            except ValueError:
                page_ref = None
            break

    # Titles: first non-numeric line
    for ln in lines:
        if not re.fullmatch(r"\d+", ln):
            titles_line = ln
            break

    # Series line: last non-numeric line (if different from titles)
    for ln in reversed(lines):
        if not re.fullmatch(r"\d+", ln):
            series_line = ln
            break

    series_code: Optional[str] = None
    if series_line:
        m = re.search(r"[Ss]erie\s+([A-Z])\b", series_line)
        if m:
            series_code = m.group(1)

    section: Dict[str, Any] = {}
    if page_ref is not None:
        section["page_ref"] = page_ref
    if titles_line is not None:
        section["titles_line"] = titles_line
    if series_line is not None:
        section["series_line"] = series_line
    if series_code is not None:
        section["series_code"] = series_code

    if section:
        enriched_ctx["airpress_section"] = section


def build_family_id(
    catalog_group: Optional[str],
    product_type: Optional[str],
    series: Optional[str],
    record: Dict[str, Any],
) -> Optional[str]:
    if not product_type:
        return None

    key_parts: List[str] = []
    if catalog_group:
        key_parts.append(catalog_group)
    key_parts.append(product_type)
    if series:
        key_parts.append(series)

    if catalog_group in {"compressed_air", "plastic_pipes"}:
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

    bestelnr = str(record.get("bestelnr") or "").strip()
    if bestelnr:
        key_parts.append(bestelnr.split(" ")[0])

    base = "-".join(slugify(p) or "x" for p in key_parts if p)
    if not base:
        return None

    digest = md5("|".join(key_parts).encode("utf-8")).hexdigest()[:6]
    return f"{base}-{digest}"


def enrich_record(rec: Dict[str, Any]) -> Dict[str, Any]:
    ctx = rec.get("_context") or {}
    source_pdf = str(ctx.get("source_pdf") or "")
    category = ctx.get("category")

    catalog_group = detect_catalog_group(source_pdf)

    # Default: use detected category as series label, but for centrifugal pumps
    # the header row often contains a generic word like 'VARIATIES'. In that
    # case, fall back to a more meaningful series name based on the catalog.
    series_raw = category
    if catalog_group == "centrifugal_pumps":
        if not series_raw or str(series_raw).strip().upper() == "VARIATIES":
            series_raw = "centrifugaal pompen"

    series = slugify(series_raw) if series_raw else None
    product_type = detect_product_type(source_pdf, category, rec)
    material = detect_material(source_pdf, category)
    family_id = build_family_id(catalog_group, product_type, series, rec)
    sku_series = detect_sku_series(rec)

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

        lengte_val = rec.get("lengte")
        if isinstance(lengte_val, str):
            m_len = re.search(r"([0-9]+(?:,[0-9]+)?)\s*m\b", lengte_val.lower())
            if m_len:
                try:
                    length_m = float(m_len.group(1).replace(",", "."))
                except ValueError:
                    length_m = None

        if length_m is None:
            for k, v in rec.items():
                if not isinstance(v, str) or not isinstance(k, str):
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

    enriched_dict = asdict(enriched_ctx)
    if diameter_mm is not None:
        enriched_dict["diameter_mm"] = diameter_mm
    if length_m is not None:
        enriched_dict["length_m"] = length_m

    enrich_airpress_specific(rec, enriched_dict)
    enrich_makita_specific(rec, enriched_dict)

    enrich_bronpompen(rec, enriched_dict)
    enrich_drive_technology(rec, enriched_dict)
    enrich_black_fittings(rec, enriched_dict)
    enrich_galvanized_pipes(rec, enriched_dict)
    enrich_airpress_nl_fr(rec, enriched_dict)

    rec["_enriched"] = enriched_dict
    return rec


def normalize_header_cell(cell: Optional[str]) -> str:
    if cell is None:
        return ""
    text = str(cell).replace("\n", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def merge_header_rows(header_rows: Sequence[HeaderRow]) -> List[str]:
    """Merge multi-line headers into single strings per column.

    Example: ["Opv.", "hoogte m"] -> "Opv. hoogte m".
    """
    if not header_rows:
        return []

    max_cols = max(len(r) for r in header_rows)
    merged: List[str] = []

    for col_idx in range(max_cols):
        parts: List[str] = []
        for row in header_rows:
            if col_idx < len(row) and row[col_idx] not in (None, ""):
                parts.append(normalize_header_cell(row[col_idx]))
        merged.append(" ".join(p for p in parts if p))

    return merged


def filter_empty_rows(rows: Sequence[DataRow]) -> List[DataRow]:
    filtered: List[DataRow] = []
    for row in rows:
        if not row:
            continue
        if all((c is None) or (str(c).strip() == "") for c in row):
            continue
        filtered.append(row)
    return filtered


def clean_row(row: DataRow) -> DataRow:
    return [str(c).strip() if c is not None else None for c in row]


def slugify_header(h: str) -> str:
    h = h.strip().lower()
    h = h.replace("/", " ")
    h = re.sub(r"[^a-z0-9]+", "_", h)
    h = re.sub(r"_+", "_", h).strip("_")
    return h


def parse_boolean(value: Optional[str]) -> Optional[bool]:
    if value is None:
        return None
    v = value.strip().lower()
    if v in {"ja", "yes", "y", "true", "1"}:
        return True
    if v in {"nee", "no", "n", "false", "0"}:
        return False
    return None


def parse_range(value: Optional[str]) -> Tuple[Optional[float], Optional[float]]:
    if not value:
        return None, None
    text = value.replace(",", ".")
    # Match patterns like "0.6 - 4.8" or "35-61"
    m = re.match(r"\s*([0-9]*\.?[0-9]+)\s*[-–]\s*([0-9]*\.?[0-9]+)\s*", text)
    if not m:
        return None, None
    try:
        return float(m.group(1)), float(m.group(2))
    except ValueError:
        return None, None


def parse_inch_size(value: Optional[str]) -> Optional[float]:
    """Parse sizes like 1/2", 2 1/2", 3" into a numeric inch value.

    Returns None if the format cannot be parsed.
    """

    if not value:
        return None
    text = str(value).strip().replace("\u201d", '"').replace("\u201c", '"')
    text = text.replace("\"", "").strip()
    if not text:
        return None

    total = 0.0
    for part in text.split():
        part = part.strip()
        if not part:
            continue
        if "/" in part:
            num, _, den = part.partition("/")
            try:
                n = float(num)
                d = float(den)
                if d != 0:
                    total += n / d
            except ValueError:
                return None
        else:
            try:
                total += float(part)
            except ValueError:
                return None

    return total if total > 0 else None


def is_bold_font(fontname: str) -> bool:
    fname = fontname.lower()
    return "bold" in fname or "bd" in fname


def detect_row_bold(page: pdfplumber.page.Page, row_bbox: Tuple[float, float, float, float]) -> bool:
    """Heuristic: if any char in this bbox uses a bold-ish font, mark in_stock=True."""
    x0, top, x1, bottom = row_bbox
    chars = page.within_bbox((x0, top, x1, bottom)).chars
    for ch in chars:
        fontname = ch.get("fontname") or ""
        if is_bold_font(fontname):
            return True
    return False


def extract_category_above_table(page: pdfplumber.page.Page, table_bbox: Tuple[float, float, float, float]) -> Tuple[Optional[str], Optional[str]]:
    x0, top, x1, _ = table_bbox
    # Clamp search region to page bounds to avoid pdfplumber bbox errors
    page_x0, page_top, page_x1, page_bottom = page.bbox
    search_top = max(page_top, top - 50)
    search_x0 = max(page_x0, x0 - 10)
    search_x1 = min(page_x1, x1 + 10)
    if search_x0 >= search_x1 or search_top >= top:
        return None, None
    # Slightly widen horizontally, but stay within page
    words = page.within_bbox((search_x0, search_top, search_x1, top)).extract_words()
    if not words:
        return None, None
    # Group words by their vertical line; use first line as header and last as application
    lines: Dict[int, List[str]] = {}
    for w in words:
        key = int(round(w["top"]))
        lines.setdefault(key, []).append(w["text"])
    if not lines:
        return None, None

    line_keys = sorted(lines.keys())
    first_line_key = line_keys[0]
    last_line_key = line_keys[-1]

    header_text = " ".join(lines[first_line_key])
    header_text = re.sub(r"\s+", " ", header_text).strip()
    application_text = " ".join(lines[last_line_key])
    application_text = re.sub(r"\s+", " ", application_text).strip()

    return (header_text or None, application_text or None)


def extract_product_specs_above_table(page: pdfplumber.page.Page, table_bbox: Tuple[float, float, float, float]) -> Dict[str, str]:
    """Extract product-level specs from the text block above/beside the table.

    These are key-value pairs like:
    - Omgevingstemperatuur: maximum 50°C
    - Maximum bedrijfsdruk: NVT
    - Vervuilingsgraad water: NVT
    - Toepassing: schakelkast voor monofasige onderwaterpompen
    - Behuizing: thermoplastisch
    - Beschermingsgraad: IP50

    Returns a dict of slugified keys to values.
    """
    x0, top, x1, _ = table_bbox
    page_x0, page_top, page_x1, page_bottom = page.bbox

    # Look at a larger region above the table (up to 250 pixels)
    search_top = max(page_top, top - 250)
    search_x0 = max(page_x0, 0)
    search_x1 = min(page_x1, page.width)

    if search_x0 >= search_x1 or search_top >= top:
        return {}

    text = page.within_bbox((search_x0, search_top, search_x1, top)).extract_text()
    if not text:
        return {}

    specs: Dict[str, str] = {}

    # Known spec labels to look for
    spec_patterns = [
        # Temperature
        (r"[Oo]mgevingstemperatuur\s*[:\-]?\s*(.+)", "max_temp"),
        (r"[Tt]emperatuurbereik\s+vloeistof\s*[:\-]?\s*(.+)", "liquid_temp_range"),
        (r"[Tt]emperatuurbereik\s*[:\-]?\s*(.+)", "temp_range"),
        # Pressure / water
        (r"[Mm]aximum\s+bedrijfsdruk\s*[:\-]?\s*(.+)", "max_pressure"),
        (r"[Vv]ervuilingsgraad\s+water\s*[:\-]?\s*(.+)", "water_pollution"),
        # Application / type
        (r"[Tt]oepassing\s*[:\-]?\s*(.+)", "application_desc"),
        (r"[Tt]ype\s*[:\-]?\s*(.+)", "product_type"),
        # Housing / material
        (r"[Bb]ehuizing\s*[:\-]?\s*(.+)", "housing"),
        (r"[Bb]eschermingsgraad\s*[:\-]?\s*(.+)", "protection_class"),
        (r"[Mm]ateriaal\s+waaier\s*[:\-]?\s*(.+)", "impeller_material"),
        (r"[Mm]ateriaal\s+lagerblok\s*[:\-]?\s*(.+)", "bearing_block_material"),
        (r"[Mm]ateriaal\s*[:\-]?\s*(.+)", "material"),
        # Manufacturer / series
        (r"[Ff]abrikant\s*[:\-]?\s*(.+)", "manufacturer"),
        (r"[Pp]roductreeks\s+fabrikant\s+lagerhuis\s*[:\-]?\s*(.+)", "housing_series"),
        (r"[Pp]roductreeks\s+fabrikant\s+lager\s*[:\-]?\s*(.+)", "bearing_series"),
        # Mounting
        (r"[Aa]sbevestiging\s*[:\-]?\s*(.+)", "shaft_mounting"),
    ]

    # Known brands to detect in text (often in title or as standalone text)
    known_brands = ["NTN", "DAB", "Rovatti", "Kranzle", "Kränzle", "Makita", "Airpress", "Pedrollo", "Grundfos", "Wilo", "Flotec", "Ebara", "Calpeda", "Lowara", "Bauer", "Georg Fischer", "GF", "Dema", "Firehose", "SDMO", "Börger", "Borger", "Honda"]
    for brand in known_brands:
        if re.search(rf"\b{brand}\b", text, re.IGNORECASE):
            specs["brand"] = brand
            break

    for pattern, key in spec_patterns:
        m = re.search(pattern, text)
        if m:
            value = m.group(1).strip()
            # Clean up: take only up to newline or next label
            value = re.split(r"\n|[A-Z][a-z]+\s*:", value)[0].strip()
            if value and value.lower() != "nvt":
                specs[key] = value

    return specs


def normalize_sku_from_bestelnr(rec: Dict[str, Any]) -> None:
    """Normalize bestelnr / order_number / code fields to a canonical 'sku' field.

    Across PDFs, the first column is often named 'bestelnr', 'order_number',
    'code', 'artikelnr', or similar. This helper copies that value to 'sku'
    so downstream consumers have a consistent field name.

    For Makita PDFs, the SKU is often in _context.category (e.g. 'B-28606')
    or _context.application (model codes like 'DLM330Z').
    """

    if rec.get("sku"):
        # Already has an explicit sku, nothing to do.
        return

    ctx = rec.get("_context") or {}
    source_pdf = str(ctx.get("source_pdf") or "").lower()

    # Makita-specific: SKU from category or application
    if "makita" in source_pdf:
        category = str(ctx.get("category") or "")
        application = str(ctx.get("application") or "")

        # Category often contains a product code like B-28606
        if category and re.match(r"^[A-Z]-?\d+", category.upper()):
            rec["sku"] = category.strip()
            return

        # Application contains model codes like "DLM330Z DLM330SM" - take the first
        if application:
            models = application.split()
            for model in models:
                model = model.strip()
                # Makita model codes typically start with letters and have digits
                if model and re.match(r"^[A-Z]{2,}[0-9]", model.upper()):
                    rec["sku"] = model
                    return

    # Check enriched data for SKU (e.g. airpress.sku)
    enr = rec.get("_enriched") or {}
    if isinstance(enr, dict):
        # Airpress compressors have SKU in _enriched.airpress.sku
        airpress = enr.get("airpress") or {}
        if isinstance(airpress, dict):
            airpress_sku = airpress.get("sku")
            if isinstance(airpress_sku, str) and airpress_sku.strip():
                rec["sku"] = airpress_sku.strip()
                return

    # Priority order for SKU-like fields (generic)
    sku_candidates = ["bestelnr", "order_number", "artikelnr", "code", "col_0"]

    for key in sku_candidates:
        val = rec.get(key)
        if isinstance(val, str) and val.strip():
            rec["sku"] = val.strip()
            return


def normalize_black_fittings_sku(rec: Dict[str, Any], source_pdf: str) -> None:
    """Normalize dynamic black-fittings SKU keys into explicit sku fields.

    For zwarte-draad-en-lasfittingen.pdf we currently get rows where the
    left column (bestelnr) becomes a dynamic key like "7bul14120" and the
    cell value sometimes contains the actual BUL* order number, e.g.:

        {"7bul14120": "7BUL38040", ...}

    or is null when only a placeholder is present:

        {"7bul14120": None, ...}

    This helper converts those patterns into a stable shape:

        - If value is a non-empty SKU-like string, set:
            sku = value (right side)
            sku_property = key (left side)
        - If value is null/empty but key looks like a SKU, set:
            sku = key
            sku_property = key

    The original dynamic key is removed from the record.
    """

    if "zwarte-draad-en-lasfittingen" not in source_pdf.lower():
        return

    sku_key: Optional[str] = None
    sku_val: Any = None

    # Find the first dynamic key that matches the 7XXXX pattern used in this PDF.
    for k, v in list(rec.items()):
        if not isinstance(k, str):
            continue
        if not re.fullmatch(r"7[0-9A-Za-z]+", k):
            continue
        sku_key = k
        sku_val = v
        break

    if not sku_key:
        return

    # Decide how to populate the canonical sku fields.
    sku_str: Optional[str] = None
    sku_property: str = sku_key

    if isinstance(sku_val, str) and sku_val.strip():
        # Right-hand side holds the actual order number (e.g. BUL38040).
        sku_str = sku_val.strip()
    else:
        # Fallback: use the dynamic key itself as sku when the value is null/empty.
        sku_str = sku_key

    # Attach normalized fields and drop the dynamic key.
    if sku_str:
        rec.setdefault("sku", sku_str)
        rec.setdefault("sku_property", sku_property)

    rec.pop(sku_key, None)


def extract_zwarte_draad_sku(rec: Dict[str, Any]) -> Optional[str]:
    """Get canonical SKU for zwarte-draad-en-lasfittingen rows.

    Prefer an explicit 'sku' field (if already normalized); otherwise use the
    first header-like key matching 7[0-9A-Za-z]+ or its non-empty value.
    """

    sku = rec.get("sku")
    if isinstance(sku, str) and sku.strip():
        return sku.strip()

    sku_key: Optional[str] = None
    sku_val: Any = None
    for k, v in rec.items():
        if not isinstance(k, str):
            continue
        if not re.fullmatch(r"7[0-9A-Za-z]+", k):
            continue
        sku_key = k
        sku_val = v
        break

    if not sku_key:
        return None

    if isinstance(sku_val, str) and sku_val.strip():
        return sku_val.strip()
    return sku_key


def extract_zwarte_draad_size_inch(rec: Dict[str, Any]) -> Optional[str]:
    """Derive size in inches from maat/maten columns or enriched black_fitting."""

    for k, v in rec.items():
        if not isinstance(k, str) or not isinstance(v, str):
            continue
        kl = k.lower()
        if "maat" in kl or "maten" in kl:
            txt = v.strip()
            if txt:
                return txt

    enr = rec.get("_enriched") or {}
    if isinstance(enr, dict):
        bf = enr.get("black_fitting") or {}
        if isinstance(bf, dict):
            size_inch = bf.get("size_inch")
            if isinstance(size_inch, str) and size_inch.strip():
                return size_inch.strip()

    return None


def extract_zwarte_draad_length_mm(rec: Dict[str, Any]) -> Optional[int]:
    """Derive physical length in mm from *_mm columns (excluding wanddikte)."""

    best: Optional[int] = None
    for k, v in rec.items():
        if not isinstance(k, str) or not isinstance(v, str):
            continue
        kl = k.lower()
        if not kl.endswith("_mm"):
            continue
        if "wanddikte" in kl:
            continue
        m = re.search(r"([0-9]+)", v)
        if not m:
            continue
        try:
            val = int(m.group(1))
        except ValueError:
            continue
        if best is None or val < best:
            best = val
    return best


def derive_zwarte_draad_description(ctx: Dict[str, Any]) -> str:
    """Map zwarte-draad table context to a readable description.

    Uses the category and application text above the table to choose a
    human-friendly label, with special casing for NR 23 pijpnippels.
    """

    category = str(ctx.get("category") or "")
    application = str(ctx.get("application") or "")

    if "NR 23 - PIJPNIPPEL" in category.upper() and "BUITENDRAAD" in application.upper():
        return "Pijpnippel Buitendraad"

    parts: List[str] = []
    if category:
        parts.append(category)
    if application:
        parts.append(application)
    if parts:
        return " - ".join(parts)
    return "Zwarte draad fitting"


def infer_type_from_context(pdf_name: str, category: Optional[str], existing: Optional[str] = None) -> Optional[str]:
    """Infer a coarse type label based on PDF filename and category text.

    Used as a fallback when the table does not provide an explicit 'Type' column.
    """
    if existing and str(existing).strip():
        return existing

    n = pdf_name.lower()
    cat = (category or "").strip()

    if "abs-persluchtbuizen" in n:
        return "compressed_air_pipe"
    if "bronpompen" in n:
        return "well_pump"
    if "centrifugaalpompen" in n:
        return "centrifugal_pump"
    if "dompelpompen" in n:
        return "submersible_pump"
    if "aandrijftechniek" in n:
        return "drive_component"
    if "drukbuizen" in n or "kunststof-afvoerleidingen" in n:
        return "plastic_pipe"
    if "kranzle" in n:
        return "pressure_washer"

    # Fallback: slugified category text if present
    if cat:
        return slugify_header(cat)

    return None


# ------------------------
# Table extraction
# ------------------------

@dataclass
class ExtractedTable:
    header: List[str]
    rows: List[DataRow]
    bboxes: List[Tuple[float, float, float, float]]  # row bounding boxes


def _row_looks_like_data(row: List[Optional[str]]) -> bool:
    """Heuristic: if the first non-empty cell looks like a product code/SKU, it's data, not a header."""
    for cell in row:
        if cell is None:
            continue
        cell = str(cell).strip()
        if not cell:
            continue
        # If first non-empty cell starts with a digit, looks like data (e.g. "17130231")
        if cell[0].isdigit():
            return True
        # Product codes: letters followed by digits (e.g. "ABSBU016", "7BUL14120", "ZF9012")
        if re.match(r"^[A-Za-z]+\d+", cell):
            return True
        # Short alphanumeric codes with digits (e.g. "T1-40", "B-28606")
        if len(cell) <= 12 and any(c.isdigit() for c in cell):
            return True
        # Otherwise assume it's a header label (e.g. "Bestelnr", "Maat", "Type")
        return False
    return False


def find_tables_with_bboxes(page: pdfplumber.page.Page) -> List[ExtractedTable]:
    """Use pdfplumber's table finder to get tables plus row bboxes.

    This gives us geometry for category detection and bold detection.
    """
    tables: List[ExtractedTable] = []
    for t in page.find_tables():
        raw = t.extract()
        if not raw or len(raw) < 2:
            continue
        header_rows = []
        data_rows = []

        # Detect how many header rows: check if row 1 looks like data
        if len(raw) >= 2 and _row_looks_like_data(raw[1]):
            # Only 1 header row
            header_rows = raw[:1]
            data_rows = raw[1:]
        elif len(raw) >= 2:
            # 2 header rows (multi-line headers)
            header_rows = raw[:2]
            data_rows = raw[2:]
        else:
            header_rows = raw[:1]
            data_rows = raw[1:]

        header = merge_header_rows(header_rows)
        data_rows = filter_empty_rows([clean_row(r) for r in data_rows])
        if not data_rows:
            continue

        # Estimate row bboxes from table bbox by evenly splitting vertically
        x0, top, x1, bottom = t.bbox
        row_height = (bottom - top) / max(len(data_rows), 1)
        row_bboxes: List[Tuple[float, float, float, float]] = []
        for i in range(len(data_rows)):
            r_top = top + i * row_height
            r_bottom = top + (i + 1) * row_height
            row_bboxes.append((x0, r_top, x1, r_bottom))

        tables.append(ExtractedTable(header=header, rows=data_rows, bboxes=row_bboxes))
    return tables


# ------------------------
# Per-PDF mappers
# ------------------------


def extract_abs_persluchtbuizen(row: DataRow, header: List[str]) -> Dict[str, Any]:
    hmap = {i: slugify_header(h) for i, h in enumerate(header)}
    obj: Dict[str, Any] = {}

    for idx, value in enumerate(row):
        key = hmap.get(idx)
        if not key:
            continue
        raw_h = header[idx] if idx < len(header) else None
        v = value
        if v is not None:
            v = v.strip()
        # Columns whose header looks like ABSBU016 etc. are actually bestelnr values,
        # not real properties. Map any non-empty cell to bestelnr and do not keep the
        # raw column key (e.g. 'absbu016').
        # Two cases:
        # 1) Header itself is a pure code like "X0817015" and the cell only has a mark
        #    (x, X, •, checkmark). Then store the header code as bestelnr.
        # 2) ABSBU016-style header where the cell v contains the actual code text.
        if raw_h is not None:
            raw_h_str = str(raw_h).strip()
        else:
            raw_h_str = ""

        mark_values = {"x", "X", "•", ""}

        # Extract leading alphanumeric code from the raw header, to handle
        # headers like "ABSKR090" or "ABSKR090 (90°)".
        header_code: Optional[str] = None
        if raw_h_str:
            m_code = re.match(r"([A-Za-z0-9]+)", raw_h_str)
            if m_code:
                header_code = m_code.group(1)

        if header_code and v in mark_values:
            obj["bestelnr"] = header_code
        elif re.match(r"^[a-z]+[0-9]+$", key) and v:
            obj["bestelnr"] = v
        elif key in {"bestelnr", "bestelnr_order_id", "order_id"}:
            obj["bestelnr"] = v
        elif key.startswith("maat") or key.startswith("maten"):
            obj["maat"] = v
        elif "werkdruk" in key or "druk" in key:
            obj["werkdruk"] = v
        elif "wanddikte" in key:
            obj["wanddikte"] = v
        # Columns like '5 m' should be treated as a length property with value '5 m'.
        elif "lengte" in key or key.endswith("_m"):
            obj["lengte"] = v
        else:
            obj[key] = v

    return obj


def extract_bronpompen(row: DataRow, header: List[str]) -> Dict[str, Any]:
    hmap = {i: slugify_header(h) for i, h in enumerate(header)}
    obj: Dict[str, Any] = {}

    for idx, value in enumerate(row):
        key = hmap.get(idx)
        if not key:
            continue
        v = value.strip() if isinstance(value, str) else value

        if key.startswith("type"):
            obj["type"] = v
        elif "vermogen" in key and "kw" in key:
            obj["vermogen_kw"] = v
        elif "debiet" in key:
            obj["debiet_m3_h"] = v
        elif "opv" in key or "hoogte" in key:
            obj["opvoerhoogte_m"] = v
        elif "aansluiting" in key:
            obj["aansluiting"] = v
        elif "230" in key:
            obj["motor_voltage_230"] = v
        elif "400" in key:
            obj["motor_voltage_400"] = v
        else:
            obj[key] = v

    return obj


def extract_aandrijftechniek(row: DataRow, header: List[str], page: pdfplumber.page.Page, row_bbox: Tuple[float, float, float, float]) -> Dict[str, Any]:
    hmap = {i: slugify_header(h) for i, h in enumerate(header)}
    obj: Dict[str, Any] = {}

    for idx, value in enumerate(row):
        key = hmap.get(idx)
        if not key:
            continue
        v = value.strip() if isinstance(value, str) else value

        if key == "code":
            obj["code"] = v
        elif "binnendiameter" in key:
            obj["binnendiameter_mm"] = v
        elif "buitendiameter" in key:
            obj["buitendiameter_mm"] = v
        elif "maximale_dynamische_belasting" in key:
            obj["max_dynamische_belasting"] = v
        elif "maximale_statische_belasting" in key:
            obj["max_statische_belasting"] = v
        else:
            obj[key] = v

    in_stock = detect_row_bold(page, row_bbox)
    obj["in_stock"] = bool(in_stock)
    return obj


def extract_centrifugaalpompen(row: DataRow, header: List[str]) -> Dict[str, Any]:
    hmap = {i: slugify_header(h) for i, h in enumerate(header)}
    obj: Dict[str, Any] = {}

    debiet_raw = None
    opv_raw = None

    for idx, value in enumerate(row):
        key = hmap.get(idx)
        if not key:
            continue
        v = value.strip() if isinstance(value, str) else value

        if key.startswith("bestelnr"):
            obj["bestelnr"] = v
        elif key.startswith("type"):
            obj["type"] = v
        elif "spanning" in key or key.endswith("_v"):
            obj["spanning_v"] = v
        elif "vermogen" in key and "kw" in key:
            obj["vermogen_kw"] = v
        elif "debiet" in key:
            debiet_raw = v
            obj["debiet_m3_h"] = v
        elif "opvoer" in key or "hoogte" in key:
            opv_raw = v
            obj["opvoerhoogte_m"] = v
        else:
            obj[key] = v

    if debiet_raw:
        dmin, dmax = parse_range(debiet_raw)
        obj["debiet_m3_h_min"] = dmin
        obj["debiet_m3_h_max"] = dmax
    if opv_raw:
        hmin, hmax = parse_range(opv_raw)
        obj["opvoerhoogte_m_min"] = hmin
        obj["opvoerhoogte_m_max"] = hmax

    return obj


def extract_dompelpompen(row: DataRow, header: List[str]) -> Dict[str, Any]:
    hmap = {i: slugify_header(h) for i, h in enumerate(header)}
    obj: Dict[str, Any] = {}

    for idx, value in enumerate(row):
        key = hmap.get(idx)
        if not key:
            continue
        v = value.strip() if isinstance(value, str) else value

        if "korrelgrootte" in key:
            obj["korrelgrootte"] = v
        elif "vlotter" in key:
            obj["vlotter"] = parse_boolean(v)
        elif "kabellengte" in key:
            obj["kabellengte"] = v
        else:
            obj[key] = v

    return obj


def extract_drukbuizen(row: DataRow, header: List[str]) -> Dict[str, Any]:
    hmap = {i: slugify_header(h) for i, h in enumerate(header)}
    obj: Dict[str, Any] = {}

    for idx, value in enumerate(row):
        key = hmap.get(idx)
        if not key:
            continue
        v = value.strip() if isinstance(value, str) else value

        # In kunststof-afvoerleidingen the header often contains order codes
        # like AB0317 / AB0322 etc. These are not real property names but the
        # bestelnr for that column. Treat such slugified keys as bestelnr
        # values instead of emitting them as separate properties.
        if re.fullmatch(r"[a-z]{2}[0-9]{3,}", key):
            if v:
                obj["bestelnr"] = v
        elif "maat" in key:
            obj["maat"] = v
        elif "wanddikte" in key:
            obj["wanddikte"] = v
        elif "lengte" in key:
            obj["lengte"] = v
        elif key == "sn" or "sn_" in key:
            obj["sn"] = v
        else:
            obj[key] = v

    return obj


def extract_kranzle_transposed(table: ExtractedTable) -> List[Dict[str, Any]]:
    """Transform a spec-vs-model matrix so each model becomes an object.

    Assumes first column is spec name, subsequent columns are models.
    """
    if not table.rows:
        return []

    # Include header row as first logical row to know model names
    # header: ["", model1, model2, ...]
    header = [normalize_header_cell(h) for h in table.header]
    rows = [header] + [clean_row(r) for r in table.rows]

    if not rows or len(rows[0]) < 2:
        return []

    model_names = rows[0][1:]
    models: List[Dict[str, Any]] = []

    for col_idx, model in enumerate(model_names, start=1):
        if model is None or str(model).strip() == "":
            continue
        m: Dict[str, Any] = {"model": str(model).strip()}

        for r in rows[1:]:
            if col_idx >= len(r):
                continue
            spec_name_raw = r[0]
            if spec_name_raw is None or str(spec_name_raw).strip() == "":
                continue
            spec_name = slugify_header(normalize_header_cell(spec_name_raw))
            value = r[col_idx]
            if isinstance(value, str):
                value = value.strip()
            m[spec_name] = value

        models.append(m)

    return models


def extract_makita_transposed(table: ExtractedTable) -> List[Dict[str, Any]]:
    """Transform Makita spec-vs-model matrix so each model becomes an object.

    Makita catalogs have transposed tables where:
    - First column: spec names (Spanning, Max.koppel, Boorkop, etc.)
    - Header row: model codes (DF002GZ01, HP001GM201, etc.)
    - Each column is a product variant

    Model codes matching patterns like XX###XX## are treated as SKUs.
    """
    if not table.rows:
        return []

    # Include header row as first logical row to know model names
    header = [normalize_header_cell(h) for h in table.header]
    rows = [header] + [clean_row(r) for r in table.rows]

    if not rows or len(rows[0]) < 2:
        return []

    model_names = rows[0][1:]
    models: List[Dict[str, Any]] = []

    # Makita model code pattern: 2+ letters, digits, optional letters/digits
    # Examples: DF002GZ01, HP001GM201, DA001GZ01, HR007GZ01, DLM330Z, BL4040
    makita_sku_pattern = re.compile(r"^[A-Z]{2,}[0-9]+[A-Z0-9]*$", re.IGNORECASE)

    for col_idx, model in enumerate(model_names, start=1):
        if model is None or str(model).strip() == "":
            continue

        model_str = str(model).strip()
        m: Dict[str, Any] = {"model": model_str}

        # If model name looks like a Makita SKU, set it as sku
        if makita_sku_pattern.match(model_str):
            m["sku"] = model_str

        for r in rows[1:]:
            if col_idx >= len(r):
                continue
            spec_name_raw = r[0]
            if spec_name_raw is None or str(spec_name_raw).strip() == "":
                continue
            spec_name = slugify_header(normalize_header_cell(spec_name_raw))
            value = r[col_idx]
            if isinstance(value, str):
                value = value.strip()
            if value:  # Only add non-empty values
                m[spec_name] = value

        # Extract price if present
        for key in list(m.keys()):
            if "prijs" in key.lower() or "excl" in key.lower() or "incl" in key.lower():
                val = m.get(key)
                if isinstance(val, str) and "€" in val:
                    # Parse price: "€ 495,00" -> 495.00
                    price_match = re.search(r"€\s*([\d.,]+)", val)
                    if price_match:
                        try:
                            price_str = price_match.group(1).replace(".", "").replace(",", ".")
                            if "excl" in key.lower():
                                m["price_excl_btw"] = float(price_str)
                            elif "incl" in key.lower():
                                m["price_incl_btw"] = float(price_str)
                        except ValueError:
                            pass

        models.append(m)

    return models


# NOTE: The following build_*_catalog functions have been removed in favor of
# the unified flatten_records_with_grouping() approach:
# - build_zuigerpompen_product_series
# - build_verzinkte_buizen_catalog  
# - build_zwarte_draad_flat
# - build_slangkoppelingen_catalog
# - build_kranzle_catalog
#
# All PDFs now output flat JSON arrays with grouping metadata (series_id, series_name, etc.)


# ------------------------
# Flat output with grouping metadata
# ------------------------


def generate_series_id(category: Optional[str], pdf_name: str) -> str:
    """Generate a unique series identifier from category and PDF name."""
    if category:
        slug = slugify(category)
        if slug:
            return slug
    # Fallback to PDF stem
    return slugify(pdf_name.replace(".pdf", "")) or "unknown"


def flatten_records_with_grouping(records: List[Dict[str, Any]], pdf_name: str) -> List[Dict[str, Any]]:
    """Convert all records to flat format with grouping metadata.
    
    Each record gets:
    - sku: the canonical SKU field
    - series_id: slugified grouping key for client-side aggregation
    - series_name: human-readable series/category name
    - All original fields preserved
    - Inherited specs denormalized from _context.product_specs
    """
    flat: List[Dict[str, Any]] = []
    
    for rec in records:
        if not isinstance(rec, dict):
            continue
        
        ctx = rec.get("_context") or {}
        enr = rec.get("_enriched") or {}
        product_specs = ctx.get("product_specs") or {}
        
        # Build the flat record
        out: Dict[str, Any] = {}
        
        # 1. SKU - canonical field
        sku = rec.get("sku")
        if not sku:
            # Try common alternatives
            for k in ("order_number", "bestelnr", "code", "model", "col_0"):
                v = rec.get(k)
                if isinstance(v, str) and v.strip():
                    sku = v.strip()
                    break
        out["sku"] = sku
        
        # 2. Series/grouping metadata
        category = ctx.get("category")
        application = ctx.get("application")
        
        out["series_id"] = generate_series_id(category, pdf_name)
        out["series_name"] = category or pdf_name.replace(".pdf", "").replace("-", " ").title()
        
        # 3. Page info for image linking
        out["page"] = ctx.get("page_number")
        
        # 4. Brand (from product_specs or context)
        brand = product_specs.get("brand") or ctx.get("brand")
        if brand:
            out["brand"] = brand
        
        # 5. Copy all non-internal fields from original record
        for k, v in rec.items():
            if k.startswith("_"):  # Skip _context, _enriched
                continue
            if k == "sku":  # Already handled
                continue
            out[k] = v
        
        # 6. Denormalize inherited product specs
        for spec_key, spec_val in product_specs.items():
            if spec_key == "brand":  # Already handled
                continue
            # Prefix with spec_ to avoid collisions
            out[f"spec_{spec_key}"] = spec_val
        
        # 7. Application as separate field
        if application:
            out["application"] = application
        
        # 8. Preserve enriched data under a cleaner structure
        if enr:
            out["_enriched"] = enr
        
        flat.append(out)
    
    # Sort by SKU for consistent output
    flat.sort(key=lambda x: str(x.get("sku") or x.get("series_id") or ""))
    
    return flat


# ------------------------
# Driver per PDF
# ------------------------


def process_pdf(
    pdf_path: Path,
    output_dir: Path,
) -> Dict[str, Any]:
    name = pdf_path.name.lower()
    records: List[Dict[str, Any]] = []

    with pdfplumber.open(str(pdf_path)) as pdf:
        print(f"  Opened {pdf_path.name} with {len(pdf.pages)} pages")
        current_category: Optional[str] = None

        for page_number, page in enumerate(pdf.pages, start=1):
            tables = find_tables_with_bboxes(page)
            if not tables:
                continue

            print(f"    Page {page_number}: found {len(tables)} tables")

            for t in tables:
                table_bbox = (page.bbox[0], page.bbox[1], page.bbox[2], page.bbox[3])
                # More precise would be t.bbox, but our row bboxes already use it; we want
                # category above the whole table.
                table_bbox = t.bboxes[0][0], t.bboxes[0][1], t.bboxes[0][2], t.bboxes[-1][3]

                header_text, application_text = extract_category_above_table(page, table_bbox)
                category = header_text or current_category
                if category:
                    current_category = category

                # Extract product-level specs from text above table (temp, pressure, etc.)
                product_specs = extract_product_specs_above_table(page, table_bbox)

                # Special handling for Kranzle (transposed tables)
                if "kranzle" in name:
                    models = extract_kranzle_transposed(t)
                    for m in models:
                        # Attach context
                        ctx = {
                            "source_pdf": pdf_path.name,
                            "page_number": page_number,
                            "category": current_category,
                        }
                        if application_text:
                            ctx["application"] = application_text
                        if product_specs:
                            ctx["product_specs"] = product_specs
                        m["_context"] = ctx
                        # Ensure generic type
                        inferred_type = infer_type_from_context(pdf_path.name, current_category, m.get("type"))
                        if inferred_type is not None:
                            m.setdefault("type", inferred_type)
                        # Apply enrichment so analyze_product_pdfs does both extract + enrich
                        m = enrich_record(m)
                        records.append(m)
                    continue

                # Special handling for Makita (transposed tables like Kranzle)
                if "makita" in name:
                    models = extract_makita_transposed(t)
                    for m in models:
                        # Attach context
                        ctx = {
                            "source_pdf": pdf_path.name,
                            "page_number": page_number,
                            "category": current_category,
                        }
                        if application_text:
                            ctx["application"] = application_text
                        if product_specs:
                            ctx["product_specs"] = product_specs
                        ctx["brand"] = "Makita"
                        m["_context"] = ctx
                        # Ensure generic type
                        inferred_type = infer_type_from_context(pdf_path.name, current_category, m.get("type"))
                        if inferred_type is not None:
                            m.setdefault("type", inferred_type)
                        # Apply enrichment
                        m = enrich_record(m)
                        records.append(m)
                    continue

                # Row-wise extraction for other PDFs
                for row, row_bbox in zip(t.rows, t.bboxes):
                    ctx = RowContext(
                        source_pdf=pdf_path.name,
                        page_number=page_number,
                        category=current_category,
                    )

                    if "abs-persluchtbuizen" in name:
                        obj = extract_abs_persluchtbuizen(row, t.header)
                    elif "bronpompen" in name:
                        obj = extract_bronpompen(row, t.header)
                    elif "aandrijftechniek" in name:
                        obj = extract_aandrijftechniek(row, t.header, page, row_bbox)
                    elif "centrifugaalpompen" in name:
                        obj = extract_centrifugaalpompen(row, t.header)
                    elif "dompelpompen" in name:
                        obj = extract_dompelpompen(row, t.header)
                    elif "drukbuizen" in name or "kunststof-afvoerleidingen" in name:
                        obj = extract_drukbuizen(row, t.header)
                    else:
                        # Fallback: generic column mapping
                        hmap = {i: slugify_header(h) for i, h in enumerate(t.header)}
                        obj = {}
                        for idx, val in enumerate(row):
                            key = hmap.get(idx) or f"col_{idx}"
                            v = val.strip() if isinstance(val, str) else val
                            obj[key] = v

                    # Ensure a generic type field is present
                    inferred_type = infer_type_from_context(pdf_path.name, current_category, obj.get("type"))
                    if inferred_type is not None:
                        obj.setdefault("type", inferred_type)

                    # Attach context before downstream normalization/enrichment
                    obj["_context"] = asdict(ctx)
                    if application_text:
                        obj["_context"]["application"] = application_text
                    if product_specs:
                        obj["_context"]["product_specs"] = product_specs

                    # Normalize zwarte-draad-en-lasfittingen dynamic SKU keys into explicit fields
                    normalize_black_fittings_sku(obj, pdf_path.name)

                    # Normalize bestelnr / order_number / code / col_0 to sku for all PDFs
                    normalize_sku_from_bestelnr(obj)

                    # Apply enrichment so this script handles the full pipeline
                    obj = enrich_record(obj)
                    records.append(obj)

    output_dir.mkdir(parents=True, exist_ok=True)
    out_path = output_dir / f"{pdf_path.stem}.json"

    # Always output flat format with grouping metadata for consistent structure
    # This replaces the previous nested catalog builders (zuigerpompen, verzinkte-buizen, etc.)
    payload = flatten_records_with_grouping(records, pdf_path.name)

    with out_path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"  Wrote JSON for {pdf_path.name} -> {out_path}")

    # Build a small summary so the caller can report an overview after all
    # PDFs are processed.
    summary: Dict[str, Any] = {
        "pdf": pdf_path.name,
        "output": str(out_path),
    }

    unique_skus: set[str] = set()
    bestelnr_count: int = 0

    def _collect_skus_from_obj(obj: Any) -> None:
        nonlocal bestelnr_count
        if isinstance(obj, dict):
            # Common keys for order/SKU codes (sku is the canonical field)
            for k in ("sku", "order_number", "bestelnr", "sku_code", "code"):
                v = obj.get(k)
                if isinstance(v, str) and v.strip():
                    val = v.strip().upper()
                    unique_skus.add(val)
                    if k == "bestelnr":
                        bestelnr_count += 1
                    break  # Only count once per record
            for v in obj.values():
                _collect_skus_from_obj(v)
        elif isinstance(obj, list):
            for v in obj:
                _collect_skus_from_obj(v)

    if isinstance(payload, list):
        summary["payload_type"] = "list"
        summary["items"] = len(payload)
        _collect_skus_from_obj(payload)
    elif isinstance(payload, dict):
        summary["payload_type"] = "object"
        # Try to give a meaningful size metric for structured catalogs
        if "product_groups" in payload and isinstance(payload["product_groups"], list):
            summary["product_groups"] = len(payload["product_groups"])
        elif "product_series" in payload:
            # Single-series object like zuigerpompen
            series = payload.get("product_series") or {}
            if isinstance(series, dict) and isinstance(series.get("variations"), list):
                summary["variations"] = len(series["variations"])
        _collect_skus_from_obj(payload)

    summary["unique_skus"] = len(unique_skus)
    summary["bestelnr_count"] = bestelnr_count

    return summary


def discover_pdfs(base_dir: Path) -> List[Path]:
    if not base_dir.exists():
        return []
    return sorted(p for p in base_dir.glob("*.pdf") if p.is_file())


def main() -> None:
    parser = argparse.ArgumentParser(description="Analyze Dema Product PDFs into JSON.")
    parser.add_argument(
        "--pdf-dir",
        type=str,
        default=r"c:\\Users\\nicol\\Projects\\DemaWebshop\\dema-webshop\\public\\documents\\Product_pdfs",
        help="Directory containing product PDFs",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=None,
        help="Output directory for JSON files (default: alongside PDF dir in 'json')",
    )

    args = parser.parse_args()
    pdf_dir = Path(args.pdf_dir)

    if args.output_dir:
        output_dir = Path(args.output_dir)
    else:
        output_dir = pdf_dir / "json"

    pdfs = discover_pdfs(pdf_dir)
    if not pdfs:
        print(f"No PDFs found in {pdf_dir}")
        return

    summaries: List[Dict[str, Any]] = []
    for pdf_path in pdfs:
        print(f"Processing {pdf_path.name}...")
        try:
            s = process_pdf(pdf_path, output_dir)
        except Exception as exc:  # pragma: no cover - safety net
            print(f"  ERROR processing {pdf_path.name}: {exc}")
            continue
        summaries.append(s)

    print(f"Done. JSON files written to {output_dir}")

    # Overview
    print("\nOverview:")
    total_unique_skus = 0
    total_bestelnr = 0
    for s in summaries:
        pdf_name = s.get("pdf")
        out = s.get("output")
        ptype = s.get("payload_type", "?")
        extra = []
        if "items" in s:
            extra.append(f"items={s['items']}" )
        if "product_groups" in s:
            extra.append(f"product_groups={s['product_groups']}")
        if "variations" in s:
            extra.append(f"variations={s['variations']}")
        if "unique_skus" in s:
            extra.append(f"unique_skus={s['unique_skus']}")
            total_unique_skus += int(s["unique_skus"] or 0)
        if "bestelnr_count" in s:
            extra.append(f"bestelnr_count={s['bestelnr_count']}")
            total_bestelnr += int(s["bestelnr_count"] or 0)
        extra_str = ("; ".join(extra)) if extra else ""
        if extra_str:
            print(f"  {pdf_name}: type={ptype}, {extra_str}\n    -> {out}")
        else:
            print(f"  {pdf_name}: type={ptype}\n    -> {out}")

    print(f"\nProcessed files: {len(summaries)}; total unique SKUs/order codes: {total_unique_skus}; total bestelnr occurrences: {total_bestelnr}")


if __name__ == "__main__":
    main()
