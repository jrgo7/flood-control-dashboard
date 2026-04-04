from flask import Blueprint, jsonify, request
from .data import load_base_data

routes = Blueprint("regions", __name__)


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

    return jsonify(
        {
            "names": regional_stats["Region"].tolist(),
            "avg_budget": regional_stats["avg_budget"].tolist(),
            "project_count": regional_stats["project_count"].tolist(),
        }
    )
