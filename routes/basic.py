import geopandas as gpd
import pandas as pd
from flask import Blueprint, render_template, jsonify, request
from functools import lru_cache

routes = Blueprint("basic", __name__, template_folder="templates")

@lru_cache(maxsize=1)
def load_base_data():
    df = pd.read_csv("data/dpwh_flood_control_projects.csv")
    df = df.dropna(subset=["ProjectLatitude", "ProjectLongitude"])
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

@routes.get("/")
def get_index():
    return render_template("index.html")

@routes.get("/api/projects")
def get_projects():
    df = load_base_data()
    
    regions_param = request.args.get("regions")
    if regions_param:
        selected_regions = regions_param.split(",")
        df = df[df["Region"].isin(selected_regions)]

    projects = df[
        [
            "ProjectId",
            "ProjectName",
            "ProjectLatitude",
            "ProjectLongitude",
            "RiskLevel",
            "ApprovedBudgetForContract",
            "Region"
        ]
    ].to_dict(orient="records")

    return jsonify(projects)

@routes.get("/api/regions")
def get_regions():
    df = load_base_data()
    
    regions_param = request.args.get("regions")
    sort_param = request.args.get("sort", "default")
    
    if regions_param:
        selected_regions = regions_param.split(",")
        df = df[df["Region"].isin(selected_regions)]

    regional_stats = (
        df.groupby("Region")
        .agg(
            avg_budget=("ApprovedBudgetForContract", "mean"),
            project_count=("ProjectName", "count"),
        )
        .reset_index()
    )

    if sort_param == "highest_budget":
        regional_stats = regional_stats.sort_values("avg_budget", ascending=False)
    elif sort_param == "lowest_budget":
        regional_stats = regional_stats.sort_values("avg_budget", ascending=True)
    elif sort_param == "highest_count":
        regional_stats = regional_stats.sort_values("project_count", ascending=False)
    elif sort_param == "lowest_count":
        regional_stats = regional_stats.sort_values("project_count", ascending=True)

    return jsonify({
        "names": regional_stats["Region"].tolist(),
        "avg_budget": regional_stats["avg_budget"].tolist(),
        "project_count": regional_stats["project_count"].tolist(),
    })

@routes.get("/api/projects/names")
def get_project_names():
    df = load_base_data()
    
    regions_param = request.args.get("regions")
    if regions_param:
        selected_regions = regions_param.split(",")
        df = df[df["Region"].isin(selected_regions)]

    names = df[["ProjectId", "ProjectName"]].dropna().to_dict(orient="records")
    return jsonify(names)

@routes.get("/api/city")
def get_city():
    print("City")

@routes.get("/api/city/names")
def get_city_names():
    print("City Name")

@routes.get("/api/city/<string:city>")
def get_city_names():
    print("City Name")

@routes.get("/api/projects/<string:project_id>")
def get_project_detail(project_id):
    df = load_base_data()
    
    project_df = df[df["ProjectId"] == project_id]

    if project_df.empty:
        return jsonify({"error": "Project not found"}), 404

    columns_to_extract = [
        "ProjectId", "ProjectName", "ProjectLatitude", "ProjectLongitude",
        "RiskLevel", "ApprovedBudgetForContract", "Region",
        "FundingYear", "Contractor", "ProjectStatus", 
        "StartDate", "ActualCompletionDate", "TypeOfWork", "Location" 
    ]
    
    available_cols = [col for col in columns_to_extract if col in project_df.columns]
    
    project_data = project_df[available_cols].iloc[0].to_dict() 

    for key, value in project_data.items():
        if pd.isna(value):
            project_data[key] = "N/A"

    return jsonify(project_data)

@routes.get("/api/refresh")
def refresh():
    load_base_data.cache_clear()
    return jsonify({"status": "cache cleared"})