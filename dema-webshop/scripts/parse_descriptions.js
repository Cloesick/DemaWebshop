const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'public', 'data', 'Product_pdfs_analysis_v2.json');
const OUT = path.resolve(__dirname, '..', 'public', 'data', 'Product_pdfs_analysis_v2.parsed.json');

function toNumber(val) {
  if (val == null) return null;
  const n = String(val).replace(',', '.');
  const f = parseFloat(n);
  return isNaN(f) ? null : f;
}

function unique(arr) {
  return Array.from(new Set(arr));
}

function parseDescription(descRaw) {
  if (!descRaw || typeof descRaw !== 'string') return {};
  const desc = descRaw.replace(/\s+/g, ' ').trim();
  const out = {};

  // Pressures
  const pressureMatches = Array.from(desc.matchAll(/(\d+(?:[.,]\d+)?)\s*bar/gi)).map(m => toNumber(m[1])).filter(n => n != null);
  if (pressureMatches.length) {
    const plausible = pressureMatches.filter(n => n >= 0.5 && n <= 50);
    const arr = plausible.length ? plausible : pressureMatches;
    out.parsed_pressure_values_bar = unique(arr);
    out.parsed_pressure_min_bar = Math.min(...arr);
    out.parsed_pressure_max_bar = Math.max(...arr);
  }

  // Flow L/min
  const flowMatches = Array.from(desc.matchAll(/(\d+)\s*L\s*\/\s*min/gi)).map(m => parseInt(m[1], 10));
  if (flowMatches.length) out.parsed_flow_l_min_list = unique(flowMatches);

  // RPM
  const rpmMatches = Array.from(desc.matchAll(/(\d+)\s*rpm/gi)).map(m => parseInt(m[1], 10));
  if (rpmMatches.length) out.parsed_rpm_list = unique(rpmMatches);

  // Dimensions L x W x H in mm
  const dimsMatches = Array.from(desc.matchAll(/(\d+)\s*x\s*(\d+)\s*x\s*(\d+)\s*mm/gi));
  if (dimsMatches.length) {
    const dims = dimsMatches.map(m => ({ length_mm: parseInt(m[1], 10), width_mm: parseInt(m[2], 10), height_mm: parseInt(m[3], 10) }));
    // Take the first triple as primary
    const primary = dims[0];
    out.parsed_length_mm = primary.length_mm;
    out.parsed_width_mm = primary.width_mm;
    out.parsed_height_mm = primary.height_mm;
    out.parsed_dimensions_mm = dims;
  }

  // Tank volumes (L) not part of L/min
  const tankMatches = Array.from(desc.matchAll(/(\d+(?:[.,]\d+)?)\s*L(?!\s*\/\s*min)/gi)).map(m => toNumber(m[1])).filter(n => n != null);
  if (tankMatches.length) out.parsed_tank_volume_l_list = unique(tankMatches);

  // Weight kg
  const weightMatches = Array.from(desc.matchAll(/(\d+(?:[.,]\d+)?)\s*kg/gi)).map(m => toNumber(m[1])).filter(n => n != null);
  if (weightMatches.length) out.parsed_weight_kg_list = unique(weightMatches);

  // Noise dB(A)
  const noiseMatches = Array.from(desc.matchAll(/(\d+(?:[.,]\d+)?)\s*dB/gi)).map(m => toNumber(m[1])).filter(n => n != null);
  if (noiseMatches.length) out.parsed_noise_db_a_list = unique(noiseMatches);

  // Power
  const hpMatches = Array.from(desc.matchAll(/(\d+(?:[.,]\d+)?)\s*hp/gi)).map(m => toNumber(m[1])).filter(n => n != null);
  if (hpMatches.length) out.parsed_power_hp_list = unique(hpMatches);
  const kwMatches = Array.from(desc.matchAll(/(\d+(?:[.,]\d+)?)\s*kW/gi)).map(m => toNumber(m[1])).filter(n => n != null);
  if (kwMatches.length) out.parsed_power_kw_list = unique(kwMatches);

  // Voltage and frequency
  const voltMatches = Array.from(desc.matchAll(/(\d+)\s*V(?!\/)/gi)).map(m => parseInt(m[1], 10));
  if (voltMatches.length) out.parsed_voltage_v_list = unique(voltMatches);
  const hzMatches = Array.from(desc.matchAll(/(\d+)\s*Hz/gi)).map(m => parseInt(m[1], 10));
  if (hzMatches.length) out.parsed_frequency_hz_list = unique(hzMatches);

  // Inch sizes like 3/4", 1", 5/4"
  const inchMatches = Array.from(desc.matchAll(/(\d+(?:\s*\/\s*\d+)?)\s*"/g)).map(m => m[1].replace(/\s*/g, ''));
  if (inchMatches.length) out.parsed_sizes_inch_list = unique(inchMatches);

  // mm sizes (avoid those that are in LxWxH dims)
  // Avoid capturing decimals like "2,0 mm" by ensuring the number is not immediately preceded by a digit and comma.
  // Also prefer typical pipe/fitting sizes (>= 10mm) to skip stray single digits.
  const mmAll = Array.from(desc.matchAll(/(?<![0-9],)(\d{2,4})\s*mm/gi)).map(m => parseInt(m[1], 10)).filter(v => v >= 10);
  let mmToExclude = [];
  if (dimsMatches.length) {
    dimsMatches.forEach(m => {
      mmToExclude.push(parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10));
    });
  }
  const mmSizes = mmAll.filter(v => !mmToExclude.includes(v));
  if (mmSizes.length) out.parsed_sizes_mm_list = unique(mmSizes);

  // Materials (limited keyword set)
  const materials = new Set();
  if (/messing/i.test(desc)) materials.add('messing');
  if (/rvs|inox/i.test(desc)) materials.add('inox');
  if (/steel|staal/i.test(desc)) materials.add('steel');
  if (materials.size) out.parsed_materials = Array.from(materials);

  // Features by keywords (multi-language)
  const features = new Set();
  if (/oil[- ]?free|olievrij|ölfrei/i.test(desc)) features.add('oilfree');
  if (/silenced|silent|geluidgedempt|insonoris|schallgedämpft/i.test(desc)) features.add('silenced');
  if (features.size) out.parsed_features = Array.from(features);

  // Phase count (e.g., "50 Hz / 1" or "50 Hz / 3")
  const phaseMatches = Array.from(desc.matchAll(/\b(?:50|60)\s*Hz\s*\/\s*(\d)\b/gi)).map(m => parseInt(m[1], 10));
  if (phaseMatches.length) out.parsed_phase_count_list = unique(phaseMatches);

  // Connection types by keywords
  const connections = new Set();
  if (/binnendraad/i.test(desc)) connections.add('binnendraad');
  if (/buitendraad/i.test(desc)) connections.add('buitendraad');
  if (/lijmmof/i.test(desc)) connections.add('lijmmof');
  if (/lijmspie/i.test(desc)) connections.add('lijmspie');
  if (/schroefdraad|draad/i.test(desc)) connections.add('draad');
  if (connections.size) out.parsed_connection_types = Array.from(connections);

  return out;
}

function primary(arr) {
  return Array.isArray(arr) && arr.length ? arr[0] : undefined;
}

function unionArray(a = [], b = []) {
  return Array.from(new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])]));
}

function mergeParsedIntoItem(item) {
  const parsed = parseDescription(item.description);
  const out = { ...item };

  // Pressures
  if (parsed.parsed_pressure_min_bar != null) out.pressure_min_bar = parsed.parsed_pressure_min_bar;
  if (parsed.parsed_pressure_max_bar != null) out.pressure_max_bar = parsed.parsed_pressure_max_bar;
  if (parsed.parsed_pressure_values_bar) out.pressure_values_bar = parsed.parsed_pressure_values_bar;

  // Flow
  if (parsed.parsed_flow_l_min_list) out.flow_l_min_list = parsed.parsed_flow_l_min_list;

  // RPM
  if (parsed.parsed_rpm_list) {
    out.rpm = primary(parsed.parsed_rpm_list);
    out.rpm_list = parsed.parsed_rpm_list;
  }

  // Dimensions (primary and list)
  if (parsed.parsed_length_mm != null) out.length_mm = parsed.parsed_length_mm;
  if (parsed.parsed_width_mm != null) out.width_mm = parsed.parsed_width_mm;
  if (parsed.parsed_height_mm != null) out.height_mm = parsed.parsed_height_mm;
  if (parsed.parsed_dimensions_mm) out.dimensions_mm = parsed.parsed_dimensions_mm;

  // Tank volume
  if (parsed.parsed_tank_volume_l_list) {
    out.volume_l = primary(parsed.parsed_tank_volume_l_list);
    out.tank_volume_l_list = parsed.parsed_tank_volume_l_list;
  }

  // Power
  if (parsed.parsed_power_hp_list) {
    out.power_hp = primary(parsed.parsed_power_hp_list);
    out.power_hp_list = parsed.parsed_power_hp_list;
  }
  if (parsed.parsed_power_kw_list) {
    out.power_kw = primary(parsed.parsed_power_kw_list);
    out.power_kw_list = parsed.parsed_power_kw_list;
  }

  // Electrical
  if (parsed.parsed_voltage_v_list) {
    out.voltage_v = primary(parsed.parsed_voltage_v_list);
    out.voltage_v_list = parsed.parsed_voltage_v_list;
  }
  if (parsed.parsed_frequency_hz_list) {
    out.frequency_hz = primary(parsed.parsed_frequency_hz_list);
    out.frequency_hz_list = parsed.parsed_frequency_hz_list;
  }
  if (parsed.parsed_phase_count_list) out.phase_count_list = parsed.parsed_phase_count_list;

  // Sizes
  if (parsed.parsed_sizes_inch_list) out.sizes_inch_list = parsed.parsed_sizes_inch_list;
  if (parsed.parsed_sizes_mm_list) out.sizes_mm_list = parsed.parsed_sizes_mm_list;

  // Noise
  if (parsed.parsed_noise_db_a_list) {
    out.noise_db_a = primary(parsed.parsed_noise_db_a_list);
    out.noise_db_a_list = parsed.parsed_noise_db_a_list;
  }

  // Weight
  if (parsed.parsed_weight_kg_list) {
    out.weight_kg = primary(parsed.parsed_weight_kg_list);
    out.weight_kg_list = parsed.parsed_weight_kg_list;
  }

  // Materials
  if (parsed.parsed_materials) out.materials = parsed.parsed_materials;

  // Connection types (union with existing)
  if (parsed.parsed_connection_types) {
    out.connection_types = unionArray(out.connection_types, parsed.parsed_connection_types);
  }

  // Features (union with existing)
  if (parsed.parsed_features) {
    out.features = unionArray(out.features, parsed.parsed_features);
  }

  return out;
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error('Source JSON not found at', SRC);
    process.exit(1);
  }
  const raw = fs.readFileSync(SRC, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse JSON:', e.message);
    process.exit(1);
  }
  if (!Array.isArray(data)) {
    console.error('Expected an array of items');
    process.exit(1);
  }

  const result = data.map(mergeParsedIntoItem);
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Wrote ${result.length} items to ${OUT}`);
}

if (require.main === module) {
  main();
}
