@echo off
echo ================================================================================
echo CONSOLIDATE SKU TO IMAGE MAPPINGS
echo ================================================================================
echo.
echo This will consolidate all sku_to_image_mapping.json files from extracted
echo catalogs into a single Product_images.json for the frontend.
echo.
echo Input:  public\product-images\extracted-catalogs\
echo Output: public\data\Product_images.json
echo.
pause
echo.
echo Starting consolidation...
echo.

python consolidate_sku_mappings.py

echo.
echo ================================================================================
echo DONE! The frontend will now use the consolidated mappings.
echo ================================================================================
pause
