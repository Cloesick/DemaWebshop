# Create placeholder grouped JSON files

$files = @(
    "pomp_specials_grouped.json",
    "messing_draadfittingen_grouped.json",
    "rvs_draadfittingen_grouped.json",
    "slangkoppelingen_grouped.json",
    "pe_buizen_grouped.json",
    "rubber_slangen_grouped.json",
    "slangklemmen_grouped.json",
    "pu_afzuigslangen_grouped.json",
    "zwarte_draad_en_lasfittingen_grouped.json",
    "kunststof_afvoerleidingen_grouped.json",
    "verzinkte_buizen_grouped.json",
    "zuigerpompen_grouped.json",
    "plat-oprolbare-slangen_grouped.json",
    "makita-catalogus-2022-nl_grouped.json",
    "makita-tuinfolder-2022-nl_grouped.json",
    "kranzle-catalogus-2021-nl-1_grouped.json",
    "airpress-catalogus-eng_grouped.json",
    "airpress-catalogus-nl-fr_grouped.json",
    "bronpompen_grouped.json",
    "centrifugaalpompen_grouped.json",
    "dompelpompen_grouped.json",
    "drukbuizen_grouped.json",
    "catalogus-aandrijftechniek-150922_grouped.json",
    "pompentoebehoren_grouped.json",
    "abs_persluchtbuizen_grouped.json",
    "verzinkte_buizen_image_mapping.json",
    "pompentoebehoren_image_mapping.json",
    "Product_images.json"
)

foreach ($file in $files) {
    $path = "public\data\$file"
    "[]" | Out-File -FilePath $path -Encoding utf8
    Write-Host "Created: $path"
}

Write-Host "`nAll placeholder files created successfully!"
