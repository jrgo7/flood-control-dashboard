import geopandas as gpd
import pandas as pd
from flask import Blueprint, render_template

routes = Blueprint("basic", __name__, template_folder="templates")

# TODO: Question, is it better to precompute this data?
@routes.get("/")
def get_index():
    df = pd.read_csv("data/dpwh_flood_control_projects.csv")
    df = df.dropna(subset=["ProjectLatitude", "ProjectLongitude"])

    # Preprocess
    df = df[df["Province"] == "Cavite"]
    df["ProjectName"] = df["ProjectName"].str.removeprefix("Construction of ")

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
    joined["ApprovedBudgetForContract"] = pd.to_numeric(joined["ApprovedBudgetForContract"], errors="coerce")
    regional_stats = joined.groupby("Region").agg(
        avg_budget=("ApprovedBudgetForContract", "mean"),
        project_count=("ProjectName", "count")
    ).reset_index()

    project_list = joined[
        [
            "ProjectName",
            "ProjectLatitude",
            "ProjectLongitude",
            "RiskLevel",
            "ApprovedBudgetForContract",
        ]
    ].to_dict(orient="records")
    region_names = regional_stats["Region"].fillna("Unknown").tolist()
    avg_budget = regional_stats["avg_budget"].fillna(0).tolist()
    project_count = regional_stats["project_count"].tolist()

    # TODO: Unsure if this is the best way to pass data to the HTML side 
    # im gonna make it worse
    return render_template(
        "index.html",
        projects=project_list,
        region_names=region_names,
        avg_budget=avg_budget,
        project_count=project_count,
    )
