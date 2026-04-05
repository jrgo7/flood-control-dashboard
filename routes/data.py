from functools import lru_cache

import pandas as pd
import geopandas as gpd
from flask import Blueprint, jsonify

routes = Blueprint("data", __name__)

@lru_cache(maxsize=1)
def load_base_data():
    df_allowed = pd.read_csv("data/province_list.csv")
    allowed_provinces = df_allowed['Province'].unique()
    gdf = gpd.read_file("data/all_joined_projects.gpkg")
    gdf = gdf[gdf['Province'].isin(allowed_provinces)].copy()
    return gdf


@routes.get("/api/refresh")
def refresh():
    load_base_data.cache_clear()
    return jsonify({"status": "cache cleared"})


def filter_by_region(df, regions_param):
    if regions_param:
        selected_regions = regions_param.split(",")
        df = df[df["Region"].isin(selected_regions)]
    return df
