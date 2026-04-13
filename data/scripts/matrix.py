import pandas as pd
import geopandas as gpd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

province_risk = pd.read_csv("data/province_risk_levels.csv")
joined_projects = gpd.read_file("data/all_joined_projects.gpkg", ignore_geometry=True)

joined = joined_projects.groupby('Province')['ApprovedBudgetForContract'].sum().reset_index()
joined.rename(columns={'ApprovedBudgetForContract': 'Total_Budget'}, inplace=True)

df = pd.merge(province_risk, joined, left_on='SHP_Province', right_on='Province', how='inner')

df['Total_Budget'] = df['Total_Budget'].fillna(0)
df['log_budget'] = np.log1p(df['Total_Budget'])
df['log_risk'] = np.log1p(df['risk_score'] * 1_000)

df['norm_budget'] = (df['log_budget'] - df['log_budget'].min()) / (df['log_budget'].max() - df['log_budget'].min())
df['norm_risk'] = (df['log_risk'] - df['log_risk'].min()) / (df['log_risk'].max() - df['log_risk'].min())

risk_mid = df['norm_risk'].mean()
budget_mid = df['norm_budget'].mean()

def assign_quadrant(row):
    r = row['norm_risk']
    b = row['norm_budget']
    
    if r >= risk_mid and b < budget_mid:
        return "Bad: High risk, low budget"
    if r < risk_mid and b >= budget_mid:
        return "Bad: Low risk, high budget"
    if r >= risk_mid and b >= budget_mid:
        return "Ideal: High risk, high budget"
    return "Ideal: Low risk, low budget"
    
df['Matrix_Scenario'] = df.apply(assign_quadrant, axis=1)

clean_export = df[['Province', 'risk_score', 'Total_Budget', 'norm_risk', 'norm_budget', 'Matrix_Scenario']]
clean_export.to_csv("data/province_list.csv", index=False)