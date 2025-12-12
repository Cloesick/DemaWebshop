@echo off
echo ================================================================================
echo BATCH PDF IMAGE EXTRACTION - ALL CATALOGS
echo ================================================================================
echo.
echo This will process all 26 PDF catalogs and extract images with SKU detection
echo.
echo Input:  documents\Product_pdfs\
echo Output: public\product-images\extracted-catalogs\
echo.
echo Estimated time: 10-15 minutes for all catalogs
echo.
pause
echo.
echo Starting batch extraction...
echo.

python extract_all_catalogs.py

echo.
echo ================================================================================
echo DONE! Check output folder for results.
echo ================================================================================
pause
