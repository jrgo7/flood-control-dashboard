import os
import pandas as pd
import geopandas as gpd

# Processed files are already included and used for the visualization.
# Before running the script, make sure to edit it to your source if you do edit it

# The province's area:
#       https://github.com/altcoder/philippines-psgc-shapefiles/blob/main/dist/PH_Adm2_ProvDists.csv
csv_data = pd.read_csv("data/PH_Adm2_ProvDists.csv")

# Place the shapefiles from this link,
#       https://drive.google.com/drive/folders/17ecJuf2vnkrpCzNVLes0fI08XFsR1x8N
# to this location, you may need to manually edit the names
# MAKE SURE EACH PROVINCE IS ON IT'S OWN FOLDER
# "Names del Sur" <- In this format, and only contains one province
# For processed shapefiles data go here:
#   
base_dir = "data/shapefiles"

summary_data = []

# This is to join the metro manila area (which are districts) into one "province"
# to match the shapefile's name
ncr_mask = csv_data['adm2_en'].str.contains('NCR,', case=False, na=False)
ncr_districts = csv_data[ncr_mask]

metro_manila_row = pd.DataFrame([{
    'adm1_psgc': 1300000000, 
    'adm2_psgc': 1300000000, 
    'adm2_en': 'Metro Manila',
    'geo_level': 'Prov', 
    'len_crs': ncr_districts['len_crs'].sum(), 
    'area_crs': ncr_districts['area_crs'].sum(),
    'len_km': ncr_districts['len_km'].sum(),
    'area_km2': ncr_districts['area_km2'].sum()
}])

csv_data = csv_data[~ncr_mask]
csv_data = pd.concat([csv_data, metro_manila_row], ignore_index=True)
area_dict = dict(zip(csv_data['adm2_en'].str.lower(), csv_data['area_crs']))

# one by one processing cause my laptop is bad

# Calculate area-weighted risk: 
#   sum_of(risk * area_of_risk) / province_total_area
for folder in os.listdir(base_dir):
    folder_path = os.path.join(base_dir, folder)
    if not os.path.isdir(folder_path):
        continue

    prov_name_lower = folder.lower()
    if prov_name_lower not in area_dict:
        print(f"Skipping {folder}: Could not find a match in the CSV.")
        continue
        
    province_total_area = area_dict[prov_name_lower]

    shp_files = [f for f in os.listdir(folder_path) if f.lower().endswith(".shp")]
    if not shp_files:
        continue

    shp_path = os.path.join(folder_path, shp_files[0])
    
    try:
        gdf = gpd.read_file(shp_path)
        gdf = gdf.to_crs(epsg=3857) 
        
        gdf['area'] = gdf.geometry.area
        gdf['Var'] = pd.to_numeric(gdf['Var'], errors='coerce').fillna(0)
        valid_gdf = gdf[gdf['Var'] > 0]
        
        total_weighted_risk = (valid_gdf['Var'] * valid_gdf['area']).sum()
        
        if province_total_area > 0:
            risk_score = total_weighted_risk / province_total_area
        else:
            risk_score = 0

        summary_data.append({
            "SHP_Province": folder,
            "risk_score": round(float(risk_score), 4)
        })

        print(f"Processed {folder}: {risk_score:.4f}")

        del gdf
        
    except Exception as e:
        print(f"Error processing {folder}: {e}")

province_risk = pd.DataFrame(summary_data)

province_risk[['SHP_Province', 'risk_score']].to_csv("data/province_risk_levels.csv", index=False)

print(f"Exported {len(province_risk)} provinces to province_risk_levels.csv")