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

    # TODO: Unsure if this is the best way to pass data to the HTML side
    return render_template(
        "index.html",
        projects=project_list,
        regions=regions,
        avg_budget=avg_budget,
        project_count=project_count
    )
