import geopandas as gpd
import pandas as pd
from flask import Blueprint, render_template

routes = Blueprint("basic", __name__, template_folder="templates")


@routes.get("/")
def get_index():
    # Load coordinates of flood control projects
    df = pd.read_csv("data/dpwh_flood_control_projects.csv")
    df = df.dropna(subset=["ProjectLatitude", "ProjectLongitude"])

    # GeoPandas
    gdf_projects = gpd.GeoDataFrame(
        df,
        geometry=gpd.points_from_xy(df.ProjectLongitude, df.ProjectLatitude),
        crs="EPSG:4326",
    )

    # Load shapefile, which has data on flood risk etc.
    # TODO: Do we just use 5 years?
    gdf_flood = gpd.read_file("data/shapefiles/Cavite_Flood_5year.shp")

    # Perform an intersection of the shapefile and the projects' coordinates
    joined = gpd.sjoin(gdf_projects, gdf_flood, how="left", predicate="intersects")

    joined["RiskLevel"] = joined["Var"].fillna(0)

    project_list = joined[
        [
            "ProjectName",
            "ProjectLatitude",
            "ProjectLongitude",
            "RiskLevel",
            "ApprovedBudgetForContract",
        ]
    ].to_dict(orient="records")

    joined["ApprovedBudgetForContract"] = pd.to_numeric(joined["ApprovedBudgetForContract"], errors="coerce")

    regional_stats = joined.groupby("Region").agg(
        avg_budget=("ApprovedBudgetForContract", "mean"),
        project_count=("ProjectName", "count")
    ).reset_index()

    # Prepare data for charts
    regions = regional_stats["Region"].fillna("Unknown").tolist()
    avg_budget = regional_stats["avg_budget"].fillna(0).tolist()
    project_count = regional_stats["project_count"].tolist()

    regions = regional_stats["Region"].fillna("Unknown").tolist()
    avg_budget = regional_stats["avg_budget"].fillna(0).tolist()
    project_count = regional_stats["project_count"].tolist()

    gdf_municities = gpd.read_file("data/shapefiles/Municities.shp.shp")

    gdf_municities = gdf_municities[["geometry", "adm3_en"]].rename(
        columns={"adm3_en": "name"}
    )
    # Ensure it's in WGS84 (Leaflet needs this)
    gdf_municities = gdf_municities.to_crs(epsg=4326)

    # TODO: somehow complexify this per zoom level? 
    gdf_municities["geometry"] = gdf_municities["geometry"].simplify(0.001)
    # Convert to GeoJSON
    municities_geojson = gdf_municities.to_json()

    # TODO: Unsure if this is the best way to pass data to the HTML side
    return render_template(
        "index.html",
        projects=project_list,
        regions=regions,
        avg_budget=avg_budget,
        project_count=project_count,
        municities=municities_geojson
    )
