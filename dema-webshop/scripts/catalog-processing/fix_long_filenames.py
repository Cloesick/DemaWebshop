"""
Fix Long Filenames for Git
===========================
Windows has a 260 character path limit. This script finds and renames
files with paths exceeding this limit to shorter, Git-friendly names.
"""

import os
import re
from pathlib import Path
from datetime import datetime

# Base directory
PROJECT_ROOT = Path(__file__).parent.parent.parent
TARGET_DIR = PROJECT_ROOT / "public" / "product-images"

# Windows path limit (including drive letter and path separators)
MAX_PATH_LENGTH = 250  # Leave some buffer

def get_full_path_length(path):
    """Get the full absolute path length"""
    return len(str(path.resolve()))

def shorten_filename(filename):
    """
    Shorten a filename intelligently:
    - Keep extension
    - Keep first part (main identifier)
    - Truncate middle details
    - Keep relevant info
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
    
    # Extract key parts
    # Pattern: MAINSKU_catalog_details[+MORESKU+MORE].ext
    
    # Try to extract main SKU (first part before underscore)
    parts = name.split('_', 1)
    main_sku = parts[0] if parts else name[:20]
    
    # Check if there's a bracketed section with additional SKUs
    bracket_match = re.search(r'\[([^\]]+)\]', name)
    if bracket_match:
        # Count how many additional SKUs
        additional = bracket_match.group(1)
        plus_count = additional.count('+')
        sku_suffix = f"_plus{plus_count}more"
    else:
        sku_suffix = ""
    
    # Create shortened name
    # Format: MAINSKU_shortened_HASH.ext
    # Use hash of full name to ensure uniqueness
    name_hash = str(hash(name))[-6:]  # Last 6 digits of hash
    
    shortened = f"{main_sku[:30]}_short_{name_hash}{sku_suffix}"
    
    if ext:
        shortened = f"{shortened}.{ext}"
    
    return shortened

def find_long_paths(base_dir):
    """Find all paths exceeding the length limit"""
    long_paths = []
    
    print(f"🔍 Scanning: {base_dir}")
    print(f"   Max path length: {MAX_PATH_LENGTH} characters\n")
    
    count = 0
    for root, dirs, files in os.walk(base_dir):
        for filename in files:
            filepath = Path(root) / filename
            path_length = get_full_path_length(filepath)
            
            count += 1
            if count % 100 == 0:
                print(f"   Scanned {count} files...")
            
            if path_length > MAX_PATH_LENGTH:
                long_paths.append((filepath, path_length))
    
    print(f"   Scanned total {count} files.\n")
    return long_paths

def rename_files(long_paths, dry_run=True):
    """Rename files to shorter names"""
    renamed = []
    errors = []
    
    for filepath, path_length in long_paths:
        old_name = filepath.name
        new_name = shorten_filename(old_name)
        new_path = filepath.parent / new_name
        
        # Check if new path is short enough
        new_length = get_full_path_length(new_path)
        
        if new_length > MAX_PATH_LENGTH:
            # Try even more aggressive shortening
            name_hash = str(hash(old_name))[-8:]
            ext = old_name.rsplit('.', 1)[-1] if '.' in old_name else ''
            new_name = f"img_{name_hash}.{ext}" if ext else f"img_{name_hash}"
            new_path = filepath.parent / new_name
            new_length = get_full_path_length(new_path)
        
        saved = path_length - new_length
        
        if dry_run:
            print(f"   WOULD RENAME:")
            print(f"      From: {old_name}")
            print(f"      To:   {new_name}")
            print(f"      Length: {path_length} → {new_length} (saved {saved} chars)")
            print()
        else:
            try:
                filepath.rename(new_path)
                renamed.append((old_name, new_name, saved))
                print(f"   ✅ RENAMED:")
                print(f"      {old_name[:60]}...")
                print(f"      → {new_name}")
                print(f"      Saved {saved} characters\n")
            except Exception as e:
                errors.append((old_name, str(e)))
                print(f"   ❌ ERROR: {old_name[:60]}...")
                print(f"      {e}\n")
    
    return renamed, errors

def create_mapping_file(renamed, output_file):
    """Create a mapping file of old → new names"""
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("# Filename Mapping (Old → New)\n")
        f.write(f"# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"# Total files renamed: {len(renamed)}\n\n")
        
        for old_name, new_name, saved in renamed:
            f.write(f"{old_name}\n")
            f.write(f"  → {new_name}\n")
            f.write(f"  (saved {saved} chars)\n\n")
    
    print(f"   📝 Mapping file created: {output_file}")

def main():
    print("=" * 80)
    print("FIX LONG FILENAMES FOR GIT")
    print("=" * 80)
    print()
    
    if not TARGET_DIR.exists():
        print(f"❌ Directory not found: {TARGET_DIR}")
        return
    
    # Find long paths
    print("📏 Step 1: Finding files with long paths...\n")
    long_paths = find_long_paths(TARGET_DIR)
    
    if not long_paths:
        print("✅ No files with long paths found! All files are Git-compatible.\n")
        return
    
    print(f"⚠️  Found {len(long_paths)} files with paths exceeding {MAX_PATH_LENGTH} chars:\n")
    
    # Show worst offenders
    long_paths_sorted = sorted(long_paths, key=lambda x: x[1], reverse=True)
    print("   Top 5 longest paths:")
    for filepath, length in long_paths_sorted[:5]:
        print(f"   - {length} chars: {filepath.name[:80]}...")
    print()
    
    # Dry run first
    print("🔍 Step 2: Dry run (preview changes)...\n")
    rename_files(long_paths, dry_run=True)
    
    # Ask for confirmation
    print("=" * 80)
    response = input("Proceed with renaming? (yes/no): ").strip().lower()
    
    if response != 'yes':
        print("\n❌ Aborted. No files were renamed.\n")
        return
    
    # Actual rename
    print("\n✏️  Step 3: Renaming files...\n")
    renamed, errors = rename_files(long_paths, dry_run=False)
    
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
        print(f"\n   ⚠️  {len(errors)} errors occurred:")
        for filename, error in errors[:5]:
            print(f"   - {filename[:60]}...: {error}")
    
    print("=" * 80)
    print("\n✅ Filename fixing complete! You can now run 'git add -A'\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Process interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
