@echo off
REM ========================================
REM Convert Markdown Guides to PDFs
REM Using Pandoc (recommended)
REM ========================================

echo.
echo ========================================
echo CONVERTING GUIDES TO PDF
echo ========================================
echo.

REM Check if pandoc is installed
where pandoc >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Pandoc not found!
    echo.
    echo Please install Pandoc first:
    echo   1. Download from: https://pandoc.org/installing.html
    echo   2. Or use: choco install pandoc
    echo.
    pause
    exit /b 1
)

echo [OK] Pandoc found
echo.

REM Create output directory
if not exist "docs-pdf" mkdir docs-pdf

REM Convert each file
echo Converting files...
echo.

echo [1/8] START_HERE.md
pandoc START_HERE.md -o docs-pdf/01_START_HERE.pdf --pdf-engine=wkhtmltopdf -V geometry:margin=2cm --toc
if %ERRORLEVEL% EQU 0 (echo    ✓ Success) else (echo    ✗ Failed)

echo [2/8] WELCOME_BACK.md
pandoc WELCOME_BACK.md -o docs-pdf/02_WELCOME_BACK.pdf --pdf-engine=wkhtmltopdf -V geometry:margin=2cm --toc
if %ERRORLEVEL% EQU 0 (echo    ✓ Success) else (echo    ✗ Failed)

echo [3/8] BATTERY_PRODUCTS_ROADMAP.md
pandoc BATTERY_PRODUCTS_ROADMAP.md -o docs-pdf/03_BATTERY_PRODUCTS_ROADMAP.pdf --pdf-engine=wkhtmltopdf -V geometry:margin=2cm --toc
if %ERRORLEVEL% EQU 0 (echo    ✓ Success) else (echo    ✗ Failed)

echo [4/8] IMPLEMENTATION_CHECKLIST.md
pandoc IMPLEMENTATION_CHECKLIST.md -o docs-pdf/04_IMPLEMENTATION_CHECKLIST.pdf --pdf-engine=wkhtmltopdf -V geometry:margin=2cm --toc
if %ERRORLEVEL% EQU 0 (echo    ✓ Success) else (echo    ✗ Failed)

echo [5/8] PREPARATION_SUMMARY.md
pandoc PREPARATION_SUMMARY.md -o docs-pdf/05_PREPARATION_SUMMARY.pdf --pdf-engine=wkhtmltopdf -V geometry:margin=2cm --toc
if %ERRORLEVEL% EQU 0 (echo    ✓ Success) else (echo    ✗ Failed)

echo [6/8] PHASE_2_IMAGES_GUIDE.md
pandoc PHASE_2_IMAGES_GUIDE.md -o docs-pdf/06_PHASE_2_IMAGES_GUIDE.pdf --pdf-engine=wkhtmltopdf -V geometry:margin=2cm --toc
if %ERRORLEVEL% EQU 0 (echo    ✓ Success) else (echo    ✗ Failed)

echo [7/8] PHASE_3_CART_GUIDE.md
pandoc PHASE_3_CART_GUIDE.md -o docs-pdf/07_PHASE_3_CART_GUIDE.pdf --pdf-engine=wkhtmltopdf -V geometry:margin=2cm --toc
if %ERRORLEVEL% EQU 0 (echo    ✓ Success) else (echo    ✗ Failed)

echo [8/8] DYNAMIC_LOADING_SUMMARY.md
pandoc DYNAMIC_LOADING_SUMMARY.md -o docs-pdf/08_DYNAMIC_LOADING_SUMMARY.pdf --pdf-engine=wkhtmltopdf -V geometry:margin=2cm --toc
if %ERRORLEVEL% EQU 0 (echo    ✓ Success) else (echo    ✗ Failed)

echo.
echo Creating combined PDF...
pandoc START_HERE.md WELCOME_BACK.md BATTERY_PRODUCTS_ROADMAP.md IMPLEMENTATION_CHECKLIST.md PREPARATION_SUMMARY.md PHASE_2_IMAGES_GUIDE.md PHASE_3_CART_GUIDE.md DYNAMIC_LOADING_SUMMARY.md -o docs-pdf/00_COMPLETE_GUIDE.pdf --pdf-engine=wkhtmltopdf -V geometry:margin=2cm --toc
if %ERRORLEVEL% EQU 0 (echo    ✓ Combined PDF created) else (echo    ✗ Failed)

echo.
echo ========================================
echo DONE!
echo ========================================
echo.
echo PDFs saved to: docs-pdf\
echo.
echo Transfer to your e-reader:
echo   1. Connect e-reader to computer
echo   2. Copy files from docs-pdf folder
echo   3. Paste to e-reader Documents folder
echo.
pause
