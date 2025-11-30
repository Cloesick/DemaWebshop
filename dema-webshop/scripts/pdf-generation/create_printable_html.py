"""
Create Printable HTML Files
============================
Converts markdown to print-ready HTML files that can be saved as PDF from browser

Usage:
    python scripts/create_printable_html.py
    
Then open HTML files in browser and print to PDF (Ctrl+P)

No external dependencies required!
"""

import os
from pathlib import Path
import re

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
OUTPUT_DIR = PROJECT_ROOT / "docs-html"

# Files to convert
DOCS_TO_CONVERT = [
    ("START_HERE.md", "01_START_HERE.html"),
    ("WELCOME_BACK.md", "02_WELCOME_BACK.html"),
    ("BATTERY_PRODUCTS_ROADMAP.md", "03_BATTERY_PRODUCTS_ROADMAP.html"),
    ("IMPLEMENTATION_CHECKLIST.md", "04_IMPLEMENTATION_CHECKLIST.html"),
    ("PREPARATION_SUMMARY.md", "05_PREPARATION_SUMMARY.html"),
    ("PHASE_2_IMAGES_GUIDE.md", "06_PHASE_2_IMAGES_GUIDE.html"),
    ("PHASE_3_CART_GUIDE.md", "07_PHASE_3_CART_GUIDE.html"),
    ("DYNAMIC_LOADING_SUMMARY.md", "08_DYNAMIC_LOADING_SUMMARY.html"),
]

# HTML Template with print-optimized CSS
HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        @media print {{
            @page {{
                margin: 2cm;
                size: A4;
            }}
            body {{
                font-size: 11pt;
            }}
        }}
        
        body {{
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: white;
        }}
        
        h1 {{
            font-size: 28pt;
            border-bottom: 4px solid #667eea;
            padding-bottom: 10px;
            margin: 30px 0 20px 0;
            color: #1a1a1a;
            page-break-after: avoid;
        }}
        
        h2 {{
            font-size: 20pt;
            margin-top: 25px;
            margin-bottom: 15px;
            color: #2d3748;
            page-break-after: avoid;
        }}
        
        h3 {{
            font-size: 16pt;
            margin-top: 20px;
            margin-bottom: 10px;
            color: #4a5568;
            page-break-after: avoid;
        }}
        
        h4 {{
            font-size: 14pt;
            margin-top: 15px;
            margin-bottom: 8px;
            color: #718096;
        }}
        
        p {{
            margin-bottom: 12px;
            orphans: 3;
            widows: 3;
        }}
        
        code {{
            background: #f7fafc;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', 'Consolas', monospace;
            font-size: 10pt;
            border: 1px solid #e2e8f0;
        }}
        
        pre {{
            background: #f7fafc;
            padding: 15px;
            border-left: 4px solid #667eea;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 10pt;
            line-height: 1.4;
            margin: 15px 0;
            page-break-inside: avoid;
        }}
        
        pre code {{
            background: none;
            border: none;
            padding: 0;
        }}
        
        ul, ol {{
            margin: 10px 0 15px 25px;
            padding-left: 20px;
        }}
        
        li {{
            margin-bottom: 6px;
        }}
        
        blockquote {{
            border-left: 4px solid #cbd5e0;
            padding-left: 20px;
            margin: 15px 0;
            color: #4a5568;
            font-style: italic;
        }}
        
        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
            page-break-inside: avoid;
            font-size: 11pt;
        }}
        
        th {{
            background: #667eea;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
        }}
        
        td {{
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
        }}
        
        tr:nth-child(even) {{
            background: #f7fafc;
        }}
        
        a {{
            color: #667eea;
            text-decoration: none;
        }}
        
        a:hover {{
            text-decoration: underline;
        }}
        
        strong {{
            font-weight: bold;
            color: #1a1a1a;
        }}
        
        em {{
            font-style: italic;
        }}
        
        hr {{
            border: none;
            border-top: 2px solid #e2e8f0;
            margin: 30px 0;
        }}
        
        .title-page {{
            text-align: center;
            margin: 100px 0 60px 0;
            page-break-after: always;
        }}
        
        .title-page h1 {{
            font-size: 36pt;
            border: none;
            margin-bottom: 20px;
        }}
        
        .subtitle {{
            font-size: 16pt;
            color: #718096;
            margin: 20px 0 10px 0;
        }}
        
        .date {{
            font-size: 14pt;
            color: #a0aec0;
        }}
        
        .checkbox {{
            margin-right: 8px;
        }}
        
        .note {{
            background: #ebf8ff;
            border-left: 4px solid #4299e1;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
        }}
        
        .warning {{
            background: #fffaf0;
            border-left: 4px solid #ed8936;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
        }}
        
        .success {{
            background: #f0fff4;
            border-left: 4px solid #48bb78;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
        }}
        
        @media print {{
            .no-print {{
                display: none;
            }}
            
            a[href]:after {{
                content: none;
            }}
        }}
    </style>
</head>
<body>
    <div class="title-page">
        <h1>{title}</h1>
        <p class="subtitle">Makita Battery Products - Implementation Guide</p>
        <p class="date">November 30, 2025</p>
    </div>
    
    <div class="no-print" style="background: #ebf8ff; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="margin-top: 0;">📄 How to Save as PDF:</h3>
        <ol>
            <li>Press <strong>Ctrl + P</strong> (or Cmd + P on Mac)</li>
            <li>Select "Save as PDF" as destination</li>
            <li>Click "Save"</li>
        </ol>
        <p style="margin-bottom: 0;"><em>This message won't appear in the PDF</em></p>
    </div>
    
    {content}
</body>
</html>
"""

def simple_markdown_to_html(md_text):
    """
    Simple markdown to HTML converter
    Handles: headers, code blocks, lists, bold, italic, links
    """
    html = md_text
    
    # Escape HTML
    # html = html.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    
    # Code blocks (```)
    def replace_code_block(match):
        code = match.group(2)
        lang = match.group(1) or ''
        return f'<pre><code class="{lang}">{code}</code></pre>'
    
    html = re.sub(r'```(\w+)?\n(.*?)\n```', replace_code_block, html, flags=re.DOTALL)
    
    # Headers
    html = re.sub(r'^# (.*?)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.*?)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^### (.*?)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    html = re.sub(r'^#### (.*?)$', r'<h4>\1</h4>', html, flags=re.MULTILINE)
    
    # Horizontal rules
    html = re.sub(r'^---+$', '<hr>', html, flags=re.MULTILINE)
    
    # Bold and italic
    html = re.sub(r'\*\*\*(.+?)\*\*\*', r'<strong><em>\1</em></strong>', html)
    html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'\*(.+?)\*', r'<em>\1</em>', html)
    
    # Inline code
    html = re.sub(r'`([^`]+)`', r'<code>\1</code>', html)
    
    # Links
    html = re.sub(r'\[([^\]]+)\]\(([^\)]+)\)', r'<a href="\2">\1</a>', html)
    
    # Unordered lists
    html = re.sub(r'^\- (.+)$', r'<li>\1</li>', html, flags=re.MULTILINE)
    html = re.sub(r'(<li>.*</li>)', r'<ul>\1</ul>', html, flags=re.DOTALL)
    html = html.replace('</ul>\n<ul>', '\n')
    
    # Ordered lists
    html = re.sub(r'^\d+\. (.+)$', r'<li>\1</li>', html, flags=re.MULTILINE)
    
    # Checkboxes
    html = html.replace('- [ ]', '<input type="checkbox" class="checkbox">')
    html = html.replace('- [x]', '<input type="checkbox" class="checkbox" checked>')
    
    # Paragraphs (wrap text not in tags)
    lines = html.split('\n')
    in_list = False
    result = []
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            result.append(line)
        elif stripped.startswith('<'):
            if '<ul>' in stripped or '<ol>' in stripped:
                in_list = True
            elif '</ul>' in stripped or '</ol>' in stripped:
                in_list = False
            result.append(line)
        elif not in_list:
            result.append(f'<p>{line}</p>')
        else:
            result.append(line)
    
    return '\n'.join(result)

def convert_to_html(md_file, html_file):
    """Convert markdown file to HTML"""
    print(f"\n📄 Processing: {md_file.name}")
    
    try:
        with open(md_file, 'r', encoding='utf-8') as f:
            md_content = f.read()
    except FileNotFoundError:
        print(f"   ⚠️  File not found")
        return False
    
    # Convert markdown to HTML
    html_content = simple_markdown_to_html(md_content)
    
    # Get title
    title = md_file.stem.replace('_', ' ').title()
    
    # Create full HTML
    full_html = HTML_TEMPLATE.format(title=title, content=html_content)
    
    # Save HTML file
    try:
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(full_html)
        
        size_kb = html_file.stat().st_size / 1024
        print(f"   ✅ Created: {html_file.name} ({size_kb:.1f} KB)")
        return True
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def create_index_html():
    """Create index page with links to all documents"""
    index_html = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Makita Battery Products - Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            background: #f7fafc;
        }
        h1 {
            color: #1a1a1a;
            border-bottom: 4px solid #667eea;
            padding-bottom: 10px;
        }
        .docs-list {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .doc-link {
            display: block;
            padding: 15px;
            margin: 10px 0;
            background: #f7fafc;
            border-left: 4px solid #667eea;
            text-decoration: none;
            color: #2d3748;
            border-radius: 4px;
            transition: all 0.2s;
        }
        .doc-link:hover {
            background: #ebf8ff;
            transform: translateX(5px);
        }
        .doc-number {
            color: #667eea;
            font-weight: bold;
            margin-right: 10px;
        }
        .instruction {
            background: #ebf8ff;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <h1>📚 Makita Battery Products Documentation</h1>
    
    <div class="instruction">
        <h3>📄 How to Save as PDF:</h3>
        <ol>
            <li>Click a document link below</li>
            <li>Press <strong>Ctrl + P</strong> (Print)</li>
            <li>Select "Save as PDF"</li>
            <li>Save to docs-pdf folder</li>
        </ol>
    </div>
    
    <div class="docs-list">
        <h2>Documentation Files:</h2>
"""
    
    for idx, (md_file, html_file) in enumerate(DOCS_TO_CONVERT, 1):
        title = md_file.replace('.md', '').replace('_', ' ').title()
        index_html += f'        <a href="{html_file}" class="doc-link"><span class="doc-number">{idx}.</span>{title}</a>\n'
    
    index_html += """
    </div>
    
    <div style="margin-top: 30px; text-align: center; color: #718096;">
        <p>Generated: November 30, 2025</p>
    </div>
</body>
</html>
"""
    
    index_file = OUTPUT_DIR / "index.html"
    with open(index_file, 'w', encoding='utf-8') as f:
        f.write(index_html)
    
    print(f"\n✅ Created: {index_file.name}")
    return index_file

def main():
    """Main execution"""
    print("=" * 80)
    print("CREATING PRINTABLE HTML FILES")
    print("=" * 80)
    print("\nThese HTML files can be opened in any browser and saved as PDF")
    print("No external software required!")
    
    # Create output directory
    OUTPUT_DIR.mkdir(exist_ok=True)
    print(f"\n📁 Output: {OUTPUT_DIR}")
    
    successful = 0
    failed = 0
    
    # Convert files
    print("\n" + "─" * 80)
    for md_file, html_file in DOCS_TO_CONVERT:
        md_path = PROJECT_ROOT / md_file
        html_path = OUTPUT_DIR / html_file
        
        if convert_to_html(md_path, html_path):
            successful += 1
        else:
            failed += 1
    
    # Create index
    print("\n" + "─" * 80)
    print("Creating index page...")
    index_file = create_index_html()
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 SUMMARY")
    print("=" * 80)
    print(f"   ✅ Successful: {successful}/{len(DOCS_TO_CONVERT)}")
    if failed > 0:
        print(f"   ❌ Failed: {failed}")
    print(f"   📁 Output: {OUTPUT_DIR}")
    
    print("\n💡 NEXT STEPS:")
    print("─" * 80)
    print(f"   1. Open: {index_file}")
    print(f"   2. Click each document link")
    print(f"   3. Press Ctrl+P and save as PDF")
    print(f"   4. Transfer PDFs to your e-reader")
    
    print("\n📖 OR open HTML files directly in browser:")
    for _, html_file in DOCS_TO_CONVERT[:3]:
        print(f"   • {OUTPUT_DIR / html_file}")
    print(f"   • ...")
    
    print("\n" + "=" * 80 + "\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Process interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
