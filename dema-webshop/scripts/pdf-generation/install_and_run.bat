@echo off
echo ================================================================================
echo PDF IMAGE EXTRACTION - SETUP AND RUN
echo ================================================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

echo [1/3] Installing Python packages...
echo.
pip install PyMuPDF Pillow pytesseract

if errorlevel 1 (
    echo.
    echo ERROR: Failed to install packages
    pause
    exit /b 1
)

echo.
echo ================================================================================
echo [2/3] Checking for Tesseract OCR...
echo ================================================================================
echo.

tesseract --version >nul 2>&1
if errorlevel 1 (
    echo WARNING: Tesseract OCR not found
    echo.
    echo OCR features will be disabled (SKUs within images won't be detected)
    echo.
    echo To enable full functionality:
    echo 1. Download Tesseract from: https://github.com/UB-Mannheim/tesseract/wiki
    echo 2. Install to default location (C:\Program Files\Tesseract-OCR\)
    echo 3. Re-run this script
    echo.
    echo Press any key to continue without OCR, or Ctrl+C to cancel...
    pause >nul
) else (
    echo Tesseract OCR found and ready!
    tesseract --version
)

echo.
echo ================================================================================
echo [3/3] Running image extraction script...
echo ================================================================================
echo.

python extract_pdf_images_with_skus.py

echo.
echo ================================================================================
echo DONE!
echo ================================================================================
echo.
echo Check the output directory for extracted images:
echo   public\product-images\extracted-makita\
echo.
pause
