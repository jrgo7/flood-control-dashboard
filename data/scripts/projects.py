import geopandas as gpd
import pandas as pd
import os

df = pd.read_csv("data/dpwh_flood_control_projects.csv")
df = df.dropna(subset=["ProjectLatitude", "ProjectLongitude", "Municipality"])
df["ProjectName"] = df["ProjectName"].str.removeprefix("Construction of ")

gdf_projects = gpd.GeoDataFrame(
    df,
    geometry=gpd.points_from_xy(df.ProjectLongitude, df.ProjectLatitude),
    crs="EPSG:4326",
)

base_dir = "data/shapefiles"
gdfs = []

for folder in os.listdir(base_dir):
    folder_path = os.path.join(base_dir, folder)
    if not os.path.isdir(folder_path):
        continue

    shp_files = [f for f in os.listdir(folder_path) if f.lower().endswith(".shp")]
    if not shp_files:
        continue

    shp_path = os.path.join(folder_path, shp_files[0])
    gdf = gpd.read_file(shp_path)
    gdf["SHP_Province"] = folder
    gdfs.append(gdf)

    print(f"Loaded {folder} -> {shp_files[0]}")

gdf_flood = gpd.GeoDataFrame(pd.concat(gdfs, ignore_index=True), crs=gdfs[0].crs)

joined = gpd.sjoin(gdf_projects, gdf_flood, how="left", predicate="intersects")

joined["RiskLevel"] = joined["Var"].fillna(0)
joined["ApprovedBudgetForContract"] = pd.to_numeric(
    joined["ApprovedBudgetForContract"], errors="coerce"
).fillna(0)

joined["ProjectStatus"] = (
    joined["StartDate"].notna() & joined["ActualCompletionDate"].notna()
).map({True: "COMPLETE", False: "INCOMPLETE"})

joined.to_file("data/all_joined_projects.gpkg", driver="GPKG")