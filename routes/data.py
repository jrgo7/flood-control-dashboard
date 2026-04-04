from functools import lru_cache

import pandas as pd
import geopandas as gpd
from flask import Blueprint, jsonify

routes = Blueprint("data", __name__)


@lru_cache(maxsize=1)
def load_base_data():
    df = pd.read_csv("data/dpwh_flood_control_projects.csv")
    df = df.dropna(subset=["ProjectLatitude", "ProjectLongitude", "Municipality"])
    df["ProjectName"] = df["ProjectName"].str.removeprefix("Construction of ")

    gdf_projects = gpd.GeoDataFrame(
        df,
        geometry=gpd.points_from_xy(df.ProjectLongitude, df.ProjectLatitude),
        crs="EPSG:4326",
    )

    gdf_flood = gpd.read_file("data/shapefiles/Cavite_Flood_5year.shp")
    joined = gpd.sjoin(gdf_projects, gdf_flood, how="left", predicate="intersects")

    joined["RiskLevel"] = joined["Var"].fillna(0)
    joined["ApprovedBudgetForContract"] = pd.to_numeric(
        joined["ApprovedBudgetForContract"], errors="coerce"
    ).fillna(0)
    joined["Region"] = joined["Region"].fillna("Unknown")

    return joined


@routes.get("/api/refresh")
def refresh():
    load_base_data.cache_clear()
    return jsonify({"status": "cache cleared"})


def filter_by_region(df, regions_param):
    if regions_param:
        selected_regions = regions_param.split(",")
        df = df[df["Region"].isin(selected_regions)]
    return df
