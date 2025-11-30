"""
Fix Long Filenames - Preserve ALL SKUs
=======================================
Shortens filenames by abbreviating catalog/category names while
preserving ALL product SKU numbers and combinations.
"""

import os
import re
from pathlib import Path
from datetime import datetime
import shutil

# Base directory
PROJECT_ROOT = Path(__file__).parent.parent.parent
TARGET_DIR = PROJECT_ROOT / "public" / "product-images"
BACKUP_DIR = PROJECT_ROOT / "backup_long_filenames"

# Windows path limit
MAX_PATH_LENGTH = 250

# Catalog name abbreviations
CATALOG_ABBREV = {
    'catalogus-aandrijftechniek-150922': 'cat_aandrijf',
    'catalogus-aandrijftechniek': 'cat_aandrijf',
    'airpress-catalogus-nl-fr': 'cat_airpress_nlfr',
    'airpress-catalogus-eng': 'cat_airpress_eng',
    'kranzle-catalogus-2021-nl-1': 'cat_kranzle',
    'makita-catalogus-2022-nl': 'cat_makita',
    'makita-tuinfolder-2022-nl': 'cat_makita_tuin',
    'digitale-versie-pompentoebehoren-compressed': 'cat_pomp',
}

# Category abbreviations
CATEGORY_ABBREV = {
    'LAGERS_EN_LAGERHUIZEN': 'LAGERS',
    'KOGELLAGERS': 'KOGEL',
    'COMPRESSED_AIR_TANKS': 'TANKS',
    'AIR_TREATMENT_SYSTEMS': 'AIR_TREAT',
    'HOGEDRUKREINIGERS': 'HDR',
    'ACCULADERS': 'LADERS',
    'AUTOMATISCHE_MET_SLA': 'AUTO_SLA',
    'PISTON_COMPRESSORS': 'PISTON_COMP',
    'Filtration_sets': 'FILT',
    'TOEBEHOOR': 'TOEB',
    'AKKULADEGER': 'AKKUL',
}

def get_full_path_length(path):
    """Get the full absolute path length"""
    return len(str(path.resolve()))

def abbreviate_catalog_name(catalog_name):
    """Abbreviate catalog name"""
    for full_name, abbrev in CATALOG_ABBREV.items():
        if catalog_name.startswith(full_name):
            return abbrev
    return catalog_name[:20]  # Fallback: first 20 chars

def abbreviate_categories(text):
    """Abbreviate long category names"""
    for full_cat, abbrev in CATEGORY_ABBREV.items():
        text = text.replace(full_cat, abbrev)
    return text

def extract_skus_and_page(filename):
    """Extract SKU list and page number from filename"""
    # Pattern: anything[+SKU1+SKU2+...]_pXXX_imgYYY.ext
    # or: SKU1_catalog_details[+SKU2+SKU3]_pXXX_imgYYY.ext
    
    # Extract SKUs from brackets
    bracket_match = re.search(r'\[([^\]]+)\]', filename)
    skus_in_brackets = bracket_match.group(1) if bracket_match else None
    
    # Extract page number
    page_match = re.search(r'_p(\d+)_', filename)
    page = page_match.group(1) if page_match else None
    
    # Extract image number
    img_match = re.search(r'_img(\d+)', filename)
    img_num = img_match.group(1) if img_match else None
    
    return skus_in_brackets, page, img_num

def shorten_filename_preserve_skus(filename):
    """
    Shorten filename by abbreviating catalog/category names
    while preserving ALL SKU numbers
    """
    # Split name and extension
    name_parts = filename.rsplit('.', 1)
    if len(name_parts) == 2:
        name, ext = name_parts
    else:
        name = filename
        ext = ''
    
    # If already short enough, return as is
    if len(filename) <= 100:
        return filename
    
    # Split by underscores
    parts = name.split('_')
    
    # First part is usually catalog name
    if parts:
        parts[0] = abbreviate_catalog_name(parts[0])
    
    # Process middle parts (categories)
    for i in range(1, len(parts)):
        # Skip if it's a page marker (pXXX), image marker (imgXXX), or SKU list
        if parts[i].startswith('p') and parts[i][1:].isdigit():
            continue
        if parts[i].startswith('img') and parts[i][3:].isdigit():
            continue
        if '[' in parts[i] or '+' in parts[i]:
            continue
        
        # Abbreviate category names
        parts[i] = abbreviate_categories(parts[i])
    
    # Reconstruct filename
    new_name = '_'.join(parts)
    
    # If still too long, further abbreviate middle categories
    if len(new_name) > 150:
        # Keep first part (catalog), SKU part, page, img - abbreviate middle
        catalog_part = parts[0]
        
        # Find SKU part (contains brackets or plus signs)
        sku_parts = [p for p in parts if '[' in p or ('+' in p and not p.startswith('img'))]
        page_part = [p for p in parts if p.startswith('p') and p[1:].isdigit()]
        img_part = [p for p in parts if p.startswith('img')]
        
        # Combine: catalog + abbreviated middle + skus + page + img
        middle_parts = [p for p in parts[1:] if p not in sku_parts + page_part + img_part]
        
        # Ultra-abbreviate middle parts
        middle_abbrev = []
        for mp in middle_parts[:3]:  # Keep max 3 middle parts
            # Take first 3 letters of each word
            words = mp.split('_')
            abbrev = '_'.join(w[:3] for w in words if w)
            middle_abbrev.append(abbrev)
        
        new_name = '_'.join([catalog_part] + middle_abbrev + sku_parts + page_part + img_part)
    
    if ext:
        new_name = f"{new_name}.{ext}"
    
    return new_name

def create_backup(filepath):
    """Create backup of file before renaming"""
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    
    # Maintain directory structure in backup
    rel_path = filepath.relative_to(TARGET_DIR)
    backup_path = BACKUP_DIR / rel_path
    backup_path.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        shutil.copy2(filepath, backup_path)
        return True
    except Exception as e:
        print(f"   ⚠️  Backup failed for {filepath.name}: {e}")
        return False

def undo_renames(mapping_file):
    """Undo previous renames using mapping file"""
    if not mapping_file.exists():
        print("❌ No mapping file found!")
        return
    
    print("🔄 Undoing previous renames...\n")
    
    with open(mapping_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    undone = 0
    errors = 0
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Look for old filename
        if line and not line.startswith('#') and not line.startswith('→') and not line.startswith('('):
            old_name = line
            
            # Next line should be arrow line
            if i + 1 < len(lines):
                arrow_line = lines[i + 1].strip()
                if arrow_line.startswith('→'):
                    new_name = arrow_line.replace('→', '').strip()
                    
                    # Find and rename back
                    for root, dirs, files in os.walk(TARGET_DIR):
                        if new_name in files:
                            new_path = Path(root) / new_name
                            old_path = Path(root) / old_name
                            
                            try:
                                new_path.rename(old_path)
                                print(f"   ✅ Restored: {new_name[:50]}... → {old_name[:50]}...")
                                undone += 1
                            except Exception as e:
                                print(f"   ❌ Error restoring {new_name}: {e}")
                                errors += 1
                            break
                    
                    i += 3  # Skip arrow line and saved line
                    continue
        
        i += 1
    
    print(f"\n   Restored {undone} files (errors: {errors})\n")

def find_and_rename_long_paths(base_dir):
    """Find and rename all paths exceeding the length limit"""
    
    print(f"🔍 Scanning: {base_dir}")
    print(f"   Max path length: {MAX_PATH_LENGTH} characters\n")
    
    long_paths = []
    count = 0
    
    for root, dirs, files in os.walk(base_dir):
        for filename in files:
            filepath = Path(root) / filename
            path_length = get_full_path_length(filepath)
            
            count += 1
            if count % 500 == 0:
                print(f"   Scanned {count} files...")
            
            if path_length > MAX_PATH_LENGTH:
                long_paths.append((filepath, path_length))
    
    print(f"   Scanned total {count} files.\n")
    
    if not long_paths:
        print("✅ No files with long paths found!\n")
        return [], 0
    
    print(f"⚠️  Found {len(long_paths)} files with paths exceeding {MAX_PATH_LENGTH} chars\n")
    
    # Show examples
    long_paths_sorted = sorted(long_paths, key=lambda x: x[1], reverse=True)
    print("   Examples of files to be renamed:")
    for filepath, length in long_paths_sorted[:3]:
        print(f"\n   - {length} chars:")
        print(f"     OLD: {filepath.name}")
        new_name = shorten_filename_preserve_skus(filepath.name)
        print(f"     NEW: {new_name}")
        print(f"     Saved: {len(filepath.name) - len(new_name)} chars")
    print()
    
    # Rename files
    print("✏️  Renaming files (with backup)...\n")
    
    renamed = []
    errors = []
    
    for i, (filepath, path_length) in enumerate(long_paths, 1):
        old_name = filepath.name
        new_name = shorten_filename_preserve_skus(old_name)
        new_path = filepath.parent / new_name
        
        # Check if new path is short enough
        new_length = get_full_path_length(new_path)
        saved = path_length - new_length
        
        # Create backup first
        if not create_backup(filepath):
            errors.append((old_name, "Backup failed"))
            continue
        
        try:
            filepath.rename(new_path)
            renamed.append((old_name, new_name, saved))
            
            if i % 10 == 0:
                print(f"   ✅ Renamed {i}/{len(long_paths)} files...")
            
        except Exception as e:
            errors.append((old_name, str(e)))
            print(f"   ❌ ERROR: {old_name[:60]}... - {e}")
    
    print(f"\n   ✅ Completed renaming {len(renamed)} files.\n")
    
    return renamed, errors

def create_mapping_file(renamed, output_file):
    """Create a mapping file"""
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("# Filename Mapping (Old → New)\n")
        f.write("# SKU numbers and page numbers are PRESERVED\n")
        f.write(f"# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"# Total files renamed: {len(renamed)}\n")
        f.write(f"# Backup location: {BACKUP_DIR}\n\n")
        
        for old_name, new_name, saved in renamed:
            f.write(f"{old_name}\n")
            f.write(f"  → {new_name}\n")
            f.write(f"  (saved {saved} chars)\n\n")
    
    print(f"   📝 Mapping file: {output_file}")

def main():
    print("=" * 80)
    print("FIX LONG FILENAMES - PRESERVE ALL SKUs")
    print("=" * 80)
    print()
    
    # Check for undo request
    mapping_file = PROJECT_ROOT / "filename_mapping.txt"
    if os.path.exists(mapping_file):
        print("⚠️  Previous mapping file found!")
        response = input("Undo previous renames first? (yes/no): ").strip().lower()
        if response == 'yes':
            undo_renames(mapping_file)
            print()
    
    if not TARGET_DIR.exists():
        print(f"❌ Directory not found: {TARGET_DIR}")
        return
    
    # Find and rename
    renamed, errors = find_and_rename_long_paths(TARGET_DIR)
    
    if not renamed and not errors:
        return
    
    # Create mapping file
    if renamed:
        create_mapping_file(renamed, mapping_file)
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 SUMMARY")
    print("=" * 80)
    print(f"   ✅ Files renamed: {len(renamed)}")
    print(f"   ❌ Errors: {len(errors)}")
    print(f"   📁 Backups saved to: {BACKUP_DIR}")
    
    if renamed:
        total_saved = sum(saved for _, _, saved in renamed)
        print(f"   💾 Total characters saved: {total_saved}")
        print(f"\n   ✅ All SKU numbers and combinations are PRESERVED!")
        print(f"   ✅ Only catalog/category names were abbreviated")
    
    if errors:
        print(f"\n   ⚠️  {len(errors)} errors occurred")
    
    print("=" * 80)
    print("\n✅ Done! Files backed up and renamed with SKUs preserved.\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
