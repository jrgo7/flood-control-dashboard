from flask import Blueprint, jsonify, request
from .data import load_base_data, filter_by_region
import pandas as pd

routes = Blueprint("province", __name__)

def group_by_province(df):
    df = df.copy()

    df["ApprovedBudgetForContract"] = pd.to_numeric(df["ApprovedBudgetForContract"], errors='coerce')
    df["RiskLevel"] = pd.to_numeric(df["RiskLevel"], errors='coerce')

    province_groups = df.groupby("Province", as_index=False).agg(
        TotalBudget=("ApprovedBudgetForContract", "sum"),
        AverageRiskLevel=("RiskLevel", "mean"),
        Region=("Region", "first"),
        ProjectCount=("ProjectName", "count"),
        MinLat=("ProjectLatitude", "min"),
        MaxLat=("ProjectLatitude", "max"),
        MinLng=("ProjectLongitude", "min"),
        MaxLng=("ProjectLongitude", "max")
    )

    return province_groups

@routes.get("/api/province")
def get_provinces():
    df = load_base_data()
    regions_param = request.args.get("regions")
    df = filter_by_region(df, regions_param)
    df = group_by_province(df)
    print(df)
    return jsonify(df.to_dict(orient="records"))


@routes.get("/api/province/names")
def get_province_names():
    df = load_base_data()
    regions_param = request.args.get("regions")
    df = filter_by_region(df, regions_param)
    return jsonify(df["Province"].dropna().unique().tolist())


@routes.get("/api/province/<string:province>")
def get_province_detail(province):
    df = load_base_data()
    df = group_by_province(df)
    
    rbm = pd.read_csv("data/province_list.csv")
    province_df = df[df["Province"] == province].copy()

    if not province_df.empty:
        rbm_match = rbm[rbm["Province"].str.lower() == province.lower()]
        
        if not rbm_match.empty:
            province_df["norm_risk"] = rbm_match["norm_risk"].values[0]
            province_df["norm_budget"] = rbm_match["norm_budget"].values[0]
            province_df["Matrix_Scenario"] = rbm_match["Matrix_Scenario"].values[0]

    return jsonify(province_df.to_dict(orient="records"))