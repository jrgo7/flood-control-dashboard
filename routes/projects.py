import pandas as pd
from flask import Blueprint, jsonify, request
from .data import load_base_data, filter_by_region

routes = Blueprint("projects", __name__)


@routes.get("/api/projects")
def get_projects():
    df = load_base_data()

    regions_param = request.args.get("regions")
    df = filter_by_region(df, regions_param)

    projects = df[
        [
            "ProjectId",
            "ProjectName",
            "ProjectLatitude",
            "ProjectLongitude",
            "RiskLevel",
            "ApprovedBudgetForContract",
            "Region",
            "Province",
        ]
    ].to_dict(orient="records")

    return jsonify(projects)


@routes.get("/api/projects/names")
def get_project_names():
    df = load_base_data()

    regions_param = request.args.get("regions")
    df = filter_by_region(df, regions_param)

    search_query = request.args.get("q")
    if search_query:
        df = df[df["ProjectName"].str.contains(search_query, case=False, na=False, regex=False)]

    names = df[["ProjectId", "ProjectName"]].dropna().to_dict(orient="records")
    return jsonify(names)


@routes.get("/api/projects/<string:project_id>")
def get_project_detail(project_id):
    df = load_base_data()

    project_df = df[df["ProjectId"] == project_id]

    if project_df.empty:
        return jsonify({"error": "Project not found"}), 404

    columns_to_extract = [
        "ProjectId",
        "ProjectName",
        "ProjectLatitude",
        "ProjectLongitude",
        "RiskLevel",
        "ApprovedBudgetForContract",
        "Region",
        "FundingYear",
        "Contractor",
        "ProjectStatus",
        "StartDate",
        "ActualCompletionDate",
        "TypeOfWork",
    ]

    available_cols = [col for col in columns_to_extract if col in project_df.columns]

    project_data = project_df[available_cols].iloc[0].to_dict()

    for key, value in project_data.items():
        if pd.isna(value):
            project_data[key] = "N/A"

    return jsonify(project_data)
