"""
Fix Long Filenames for Git (Auto Mode)
=======================================
Automatically renames files with paths exceeding Windows limit.
No confirmation required - runs immediately.
"""

import os
import re
from pathlib import Path
from datetime import datetime

# Base directory
PROJECT_ROOT = Path(__file__).parent.parent.parent
TARGET_DIR = PROJECT_ROOT / "public" / "product-images"

# Windows path limit
MAX_PATH_LENGTH = 250

def get_full_path_length(path):
    """Get the full absolute path length"""
    return len(str(path.resolve()))

def shorten_filename(filename):
    """Shorten a filename intelligently"""
    name_parts = filename.rsplit('.', 1)
    if len(name_parts) == 2:
        name, ext = name_parts
    else:
        name = filename
        ext = ''
    
    # If already short enough, return as is
    if len(filename) <= 100:
        return filename
    
    # Extract main SKU (first part before underscore)
    parts = name.split('_', 1)
    main_sku = parts[0] if parts else name[:20]
    
    # Check for bracketed additional SKUs
    bracket_match = re.search(r'\[([^\]]+)\]', name)
    if bracket_match:
        additional = bracket_match.group(1)
        plus_count = additional.count('+')
        sku_suffix = f"_plus{plus_count}more"
    else:
        sku_suffix = ""
    
    # Create shortened name with hash
    name_hash = str(abs(hash(name)))[-6:]
    shortened = f"{main_sku[:30]}_short_{name_hash}{sku_suffix}"
    
    if ext:
        shortened = f"{shortened}.{ext}"
    
    return shortened

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
    
    # Show top 5
    long_paths_sorted = sorted(long_paths, key=lambda x: x[1], reverse=True)
    print("   Top 5 longest paths:")
    for filepath, length in long_paths_sorted[:5]:
        print(f"   - {length} chars: {filepath.name[:80]}...")
    print()
    
    # Rename files
    print("✏️  Renaming files...\n")
    
    renamed = []
    errors = []
    
    for i, (filepath, path_length) in enumerate(long_paths, 1):
        old_name = filepath.name
        new_name = shorten_filename(old_name)
        new_path = filepath.parent / new_name
        
        # Check if new path is short enough
        new_length = get_full_path_length(new_path)
        
        if new_length > MAX_PATH_LENGTH:
            # More aggressive shortening
            name_hash = str(abs(hash(old_name)))[-8:]
            ext = old_name.rsplit('.', 1)[-1] if '.' in old_name else ''
            new_name = f"img_{name_hash}.{ext}" if ext else f"img_{name_hash}"
            new_path = filepath.parent / new_name
            new_length = get_full_path_length(new_path)
        
        saved = path_length - new_length
        
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
        f.write(f"# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"# Total files renamed: {len(renamed)}\n\n")
        
        for old_name, new_name, saved in renamed:
            f.write(f"{old_name}\n")
            f.write(f"  → {new_name}\n")
            f.write(f"  (saved {saved} chars)\n\n")
    
    print(f"   📝 Mapping file: {output_file}")

def main():
    print("=" * 80)
    print("FIX LONG FILENAMES FOR GIT (AUTO MODE)")
    print("=" * 80)
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
        mapping_file = PROJECT_ROOT / "filename_mapping.txt"
        create_mapping_file(renamed, mapping_file)
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 SUMMARY")
    print("=" * 80)
    print(f"   ✅ Files renamed: {len(renamed)}")
    print(f"   ❌ Errors: {len(errors)}")
    
    if renamed:
        total_saved = sum(saved for _, _, saved in renamed)
        print(f"   💾 Total characters saved: {total_saved}")
        print(f"\n   All renamed files are now Git-compatible!")
    
    if errors:
        print(f"\n   ⚠️  {len(errors)} errors occurred")
    
    print("=" * 80)
    print("\n✅ Done! You can now run 'git add -A'\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
