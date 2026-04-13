# Flood Risk-Infrastructure Dashboard

This repository contains the code for an interactive dashboard that visualizes how well flood control infrastructure aligns with actual flood risks in the Philippines.

## Installation and running

This project uses [the `uv` Python package and project manager.](https://docs.astral.sh/uv/) Please install it to your system if it isn't installed. Then, on the project's root directory, run:

1. `uv sync`
2. `uv run flask run`


## Datasets and Data Processing

Processed files are already included in this repository and are used for the visualization by default. You do not need to download the dataset, or run the processing scripts UNLESS you are updating the raw data.

If you plan to process the data yourself, you will need to download the raw datasets and place them in the correct directories.

### Datasets

#### DPWH Flood Control Projects
* **Source:** [DPWH Flood Control Projects](https://www.kaggle.com/datasets/bwandowando/dpwh-flood-control-projects?resource=download)
* **Location:** `/data` 

#### Flood Risk Level Shapefiles
* **Source:** [NOAH - 5 Year Flood Risk](https://drive.google.com/drive/folders/17ecJuf2vnkrpCzNVLes0fI08XFsR1x8N)
* **Location:** Extract to `data/shapefiles/`. Each province must be placed inside its own folder within `data/shapefiles/`. The folder name must be correctly formatted as the province name (e.g., Davao del Sur). You may need to manually sort/rename the folders after extraction to match this exact format. 
* **Alternatively,** you may download already formatted files here: [Formatted Shapefiles](https://drive.google.com/drive/folders/14YHWiJaTbpFqhM8NtnNkAmnBQg5dc99l?usp=sharing).

#### Province Area.
* **Source:** [PSGC Administrative Boundaries](https://github.com/altcoder/philippines-psgc-shapefiles/blob/main/dist/PH_Adm2_ProvDists.csv)
* **Location:** `/data`.
  

### Processing Scripts

Once the raw data is in place, run the processing scripts from the root directory of the project in this exact order:

1. `python data/scripts/risk_level.py`
2. `python data/scripts/projects.py`
3. `python data/scripts/matrix.py`

### Processed Data

Running the scripts should generate the following processed files used by the web application:

1. **`all_joined_projects.gpkg`** - Contains the project information along with their calculated risk levels.
2. **`province_list.csv`** - Contains the computed risk-to-budget matrix per province.

## Contributing

- This project uses pre-commit hooks for formatting. Please run `uvx pre-commit install` after cloning this repository.
- To run the app with hot reload (i.e. changes are reflected immediately), run `uv run flask --debug run`.
