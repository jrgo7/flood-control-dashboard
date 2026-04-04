from flask import Blueprint, jsonify, request
from .data import load_base_data, filter_by_region

routes = Blueprint("city", __name__)


def group_by_municipality(df):
    city_groups = df.groupby("Municipality").agg(
        TotalBudget=("ApprovedBudgetForContract", "sum"),
        AverageRiskLevel=("RiskLevel", "mean"),
        Region=("Region", "first"),
        ProjectCount=("ProjectName", "count"),
    )
    return city_groups


@routes.get("/api/city")
def get_cities():
    df = load_base_data()
    regions_param = request.args.get("regions")
    df = filter_by_region(df, regions_param)
    df = group_by_municipality(df)
    print(df)
    return jsonify(df.to_dict(orient="records"))


@routes.get("/api/city/names")
def get_city_names():
    df = load_base_data()
    regions_param = request.args.get("regions")
    df = filter_by_region(df, regions_param)
    return jsonify(df["Municipality"].unique().tolist())


@routes.get("/api/city/<string:municipality>")
def get_municipality_detail(municipality):
    df = load_base_data()
    df = group_by_municipality(df)
    municipality_df = df[df["Municipality"] == municipality]
    return jsonify(municipality_df.to_dict(orient="records"))
