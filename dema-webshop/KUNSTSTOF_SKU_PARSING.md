# Kunststof-Afvoerleidingen SKU Parsing ✅

## 🎯 **Objective**

Parse SKU codes from `kunststof-afvoerleidingen` catalog to extract diameter, length, and angle properties automatically.

---

## 📋 **SKU Patterns Implemented**

### **Pattern 1: AB0322 (2 letters + 4 digits)**
```
AB0322
││└┴┴┴── Numbers
││  └─── Last digit (2) = Length in meters (2m)
││  
│└──── First 3 digits (032) = Diameter in mm (32mm)
│
└───── Type indicator (AB)
```

**Examples:**
- `AB0322` → Diameter: 32mm, Length: 2m ✅
- `AB0324` → Diameter: 32mm, Length: 4m ✅
- `AB0404` → Diameter: 40mm, Length: 4m ✅

**Products matched:** 11

---

### **Pattern 2: T032453 (T + 6 digits)**
```
T032453
│└┴┴┴┴┴── Numbers
│  │ │
│  │ └── Last digit (3) = Length in meters (3m)
│  │
│  └──── Middle 2 digits (45) = Angle in degrees (45°)
│
└────── First 3 digits (032) = Diameter in mm (32mm)
```

**Examples:**
- `T032453` → Diameter: 32mm, Angle: 45°, Length: 3m ✅
- `T040453` → Diameter: 40mm, Angle: 45°, Length: 3m ✅
- `T090452` → Diameter: 90mm, Angle: 45°, Length: 2m ✅

**Products matched:** 36

---

### **Pattern 3: EB032452 (2 letters + 6 digits)**
```
EB032452
││└┴┴┴┴┴── Numbers
││  │ │
││  │ └── Last digit (2) = Length in meters (2m)
││  │
││  └──── Middle 2 digits (45) = Angle in degrees (45°)
││
│└────── First 3 digits (032) = Diameter in mm (32mm)
│
└─────── Type indicator (EB)
```

**Examples:**
- `EB032452` → Diameter: 32mm, Angle: 45°, Length: 2m ✅
- `EB040452` → Diameter: 40mm, Angle: 45°, Length: 2m ✅
- `EB050451` → Diameter: 50mm, Angle: 45°, Length: 1m ✅

**Products matched:** 54

---

### **Pattern 4: T11090 (T + 5 digits)**
```
T11090
│└┴┴┴┴── Numbers
│  └──── Last 2 digits (90) = Angle in degrees (90°)
│
└────── First 3 digits (110) = Diameter in mm (110mm)
```

**Examples:**
- `T11090` → Diameter: 110mm, Angle: 90° ✅
- `T12590` → Diameter: 125mm, Angle: 90° ✅

**Products matched:** 3

---

## 📊 **Results Summary**

```
Total products in catalog: 337
Successfully parsed:       104 (30.9%)
Could not parse:           233 (69.1%)

By Pattern:
  - AB0322 (2L + 4D):       11 products
  - T032453 (T + 6D):       36 products
  - EB032452 (2L + 6D):     54 products
  - T11090 (T + 5D):         3 products
```

---

## ✅ **Properties Added**

### **1. diameter_mm**
- Product diameter in millimeters
- Extracted from SKU code
- Always present in parsed products

**Examples:**
- `AB0322` → `diameter_mm: 32`
- `T040453` → `diameter_mm: 40`
- `EB100451` → `diameter_mm: 100`

---

### **2. length_m**
- Product length in meters
- Extracted from SKU code
- Present when SKU includes length digit

**Examples:**
- `AB0322` → `length_m: 2`
- `T032453` → `length_m: 3`
- `EB050451` → `length_m: 1`

---

### **3. angle_degrees**
- Angle in degrees
- Extracted from SKU code
- Present for T-type and 2-letter 6-digit products

**Examples:**
- `T032453` → `angle_degrees: 45`
- `EB032452` → `angle_degrees: 45`
- `T11090` → `angle_degrees: 90`

---

## 🔍 **Unparsed SKUs**

**233 products could not be parsed automatically.**

**Common unparsed patterns:**
- `ABB032`, `ABB040`, `ABB050` (3 letters + 3 digits)
- `RAL7037` (color codes)
- `SN1` (simple codes)
- `EK032`, `OB032` (2 letters + 3 digits)
- `CF04025` (2 letters + 5 digits)

**Reason:** These SKUs don't follow the standard diameter+length+angle pattern, they might be:
- Accessory products
- Color/material variants
- Special fittings
- Non-standard items

---

## 🎨 **Frontend Display**

Products now display extracted properties on their cards:

```
Product Card:
┌──────────────────────────────────┐
│ [Image]                          │
│                                  │
│ SKU: AB0322                      │
│ Name: Drainage Pipe              │
│                                  │
│ ⊙ Diameter: 32mm                │ ← diameter_mm
│ 📏 Length: 2m                    │ ← length_m
│ ∠ Angle: 45°                     │ ← angle_degrees (if present)
│                                  │
│ [Request Quote]                  │
└──────────────────────────────────┘
```

**Icons used:**
- ⊙ (diameter_mm)
- 📏 (length_m)
- ∠ (angle_degrees)

---

## 📁 **Files**

### **Created:**
1. `scripts/analyze_kunststof_sku.py`
   - Analyzes SKU patterns in catalog
   - Shows distribution of patterns

2. `scripts/parse_kunststof_sku_codes.py`
   - Interactive parsing script
   - Detailed pattern analysis
   - Manual apply step

3. `scripts/apply_kunststof_properties.py`
   - Automatic property application
   - No user input required
   - Production-ready

### **Modified:**
1. `src/data/catalog_products.json`
   - Added `diameter_mm` to 104 products
   - Added `length_m` to applicable products
   - Added `angle_degrees` to applicable products

---

## 🧪 **Verification**

### **Check Applied Properties:**
```python
import json

with open('src/data/catalog_products.json', 'r') as f:
    products = json.load(f)

kunststof = [p for p in products if p.get('catalog') == 'kunststof-afvoerleidingen']

# Check products with properties
with_diameter = [p for p in kunststof if 'diameter_mm' in p]
with_length = [p for p in kunststof if 'length_m' in p]
with_angle = [p for p in kunststof if 'angle_degrees' in p]

print(f"Products with diameter_mm: {len(with_diameter)}")
print(f"Products with length_m: {len(with_length)}")
print(f"Products with angle_degrees: {len(with_angle)}")
```

**Expected output:**
```
Products with diameter_mm: 104
Products with length_m: 101
Products with angle_degrees: 93
```

---

## 💡 **Usage**

### **Re-apply Properties:**
```bash
python scripts/apply_kunststof_properties.py
```

### **Analyze Patterns:**
```bash
python scripts/analyze_kunststof_sku.py
```

### **Interactive Parsing:**
```bash
python scripts/parse_kunststof_sku_codes.py
```

---

## 🎯 **Key Rules**

### **All Diameters in Millimeters:**
- ✅ SKU `032` = 32mm (not 0.32mm or 320mm)
- ✅ SKU `110` = 110mm
- ✅ SKU `040` = 40mm

### **Length Always in Meters:**
- ✅ Last digit `2` = 2m (not 2cm or 2mm)
- ✅ Last digit `4` = 4m
- ✅ Last digit `1` = 1m

### **Angle Always in Degrees:**
- ✅ Middle digits `90` = 90°
- ✅ Middle digits `45` = 45°
- ✅ Middle digits `30` = 30°

---

## ✅ **Summary**

**Implemented:**
- ✅ 4 SKU pattern parsers
- ✅ Automatic property extraction
- ✅ 104 products updated (30.9%)
- ✅ Properties: diameter_mm, length_m, angle_degrees

**Properties now available:**
- ✅ Diameter in mm (from SKU)
- ✅ Length in meters (from SKU)
- ✅ Angle in degrees (from SKU)

**Frontend impact:**
- ✅ Product cards show extracted specs
- ✅ Consistent property display
- ✅ Better product information

**Status:** ✅ COMPLETE and APPLIED!

---

**Generated:** November 28, 2025  
**Catalog:** kunststof-afvoerleidingen  
**Products Updated:** 104/337 (30.9%)  
**Properties Added:** diameter_mm, length_m, angle_degrees
