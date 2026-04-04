import { initializeCharts } from "./chart.js";
import { getProjectRegionData } from "./data.js";

const markers = new Map();

document.addEventListener("DOMContentLoaded", async () => {
  const { projectData, regionData } = await getProjectRegionData();

  const viewCavite = [[14.3456, 120.9365], 11];
  const worldMap = L.map("map").setView(...viewCavite);

  L.tileLayer(
    "https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png",
    {
      attribution:
        "© Stadia Maps, © Stamen Design, © OpenStreetMap contributors",
      maxZoom: 18,
    },
  ).addTo(worldMap);

  projectData.forEach((project) => markProjectToMap(project, worldMap));

  initializeCharts(regionData);
  initializeToggleButtons(worldMap);
});



// Projects

const getRiskColor = (level) => {
  const colors = {
    3: "hsl(0, 100%, 50%)",
    2: "hsl(60, 100%, 50%)",
    1: "hsl(120, 100%, 50%)",
  };
  return colors[level] || "#808080";
};

const markProjectToMap = (proj, worldMap) => {
  const color = getRiskColor(proj.RiskLevel);
  const coordinates = [proj.ProjectLatitude, proj.ProjectLongitude];
  const style = {
    radius: 6,
    fillColor: color,
    color: "#fff",
    weight: 1,
    fillOpacity: 0.8,
  };

  const popupHTML =
    `<strong>${proj.ProjectName}</strong><br>` +
    `Budget: ₱${proj.ApprovedBudgetForContract.toLocaleString()}<br>` +
    `Flood risk: ${proj.RiskLevel}<br>` +
    `Region: ${proj.Region}`;

  const marker = L.circleMarker(coordinates, style);
  marker.addTo(worldMap);
  marker.bindPopup(popupHTML);
  markers.set(proj.ProjectId, marker);
};

const listProject = (projectId, projectName, worldMap) => {
  const floodControlProjects = document.querySelector(
    "#flood-control-projects-list",
  );
  const projectListing = document.createElement("li");
  projectListing.innerText = projectName;
  projectListing.dataset.projectId = projectId;

  projectListing.onclick = async () => {
    const response = await fetch(`/api/projects/${projectId}`);

    if (response.ok) {
      const projData = await response.json();
      worldMap.flyTo([projData.ProjectLatitude, projData.ProjectLongitude], 18);
      markers.get(projectId).openPopup();
      updateProjectStatsPanel(projData);
    }
  };
  floodControlProjects.appendChild(projectListing);
};

const clearProjectList = () => {
  document.querySelector("#flood-control-projects-list").innerHTML = "";
};

const populateProjectsList = async (worldMap) => {
  clearProjectList();

  const response = await fetch(`/api/projects/names`);
  const projects = await response.json();

  projects.forEach((proj) => {
    listProject(proj.ProjectId, proj.ProjectName, worldMap);
  });
};

const populateCities = () => {
  clearProjectList();

  /* TODO: City stats handling*/
};

const initializeToggleButtons = (worldMap) => {
  const toggleBtns = document.getElementsByClassName("toggle-btn");
  const listPanel = document.getElementById("flood-control-projects");
  const controls = document.querySelector(".list-controls");

  let activeType = null;
  listPanel.style.display = "none";
  controls.style.display = "none";

  Array.from(toggleBtns).forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      Array.from(toggleBtns).forEach((b) => b.classList.remove("active"));

      if (activeType === type) {
        activeType = null;
        listPanel.style.display = "none";
        controls.style.display = "none";
      } else {
        activeType = type;
        btn.classList.add("active");
        listPanel.style.display = "flex";
        controls.style.display = "flex";
        if (type === "projects") {
          populateProjectsList(worldMap);
        } else if (type === "cities") {
          populateCities();
        }
      }
      if (worldMap) worldMap.invalidateSize();
    });
  });
};

const updateProjectStatsPanel = (data) => {
  const idIndicator = document.getElementById("project-id");
  idIndicator.innerText = data.ProjectId || "N/A";

  idIndicator.className = "project-id-risk-indicator";
  if (data.RiskLevel >= 3) idIndicator.classList.add("risk-level-high");
  else if (data.RiskLevel === 2) idIndicator.classList.add("risk-level-medium");
  else idIndicator.classList.add("risk-level-low");

  document.getElementById("project-name").innerText =
    data.ProjectName || "Unknown Project";

  const budgetVal = document.querySelector(
    "#project-financials .date-box:nth-child(1) .box-value",
  );
  const fundingYearVal = document.querySelector(
    "#project-financials .date-box:nth-child(2) .box-value",
  );

  budgetVal.innerText = data.ApprovedBudgetForContract
    ? `₱${data.ApprovedBudgetForContract.toLocaleString()}`
    : "N/A";
  fundingYearVal.innerText = data.FundingYear || "N/A";

  const contractorList = document.querySelector(".contractor-list");
  contractorList.innerHTML = "";

  const contractors =
    data.Contractor && data.Contractor !== "N/A"
      ? data.Contractor.split(",")
      : ["No contractors listed"];

  document.getElementById("contractor-count").innerText =
    `(${contractors.length})`;

  contractors.forEach((contractor) => {
    const li = document.createElement("li");
    li.innerText = contractor.trim();
    contractorList.appendChild(li);
  });
  const statusText = document.querySelector("#project-status .progress-text");
  statusText.innerText = data.ProjectStatus || "UNKNOWN";

  document.querySelector("#start-date-box .box-value").innerText =
    data.StartDate || "N/A";
  document.querySelector("#end-date-box .box-value").innerText =
    data.ActualCompletionDate || "N/A";
  document.querySelector("#project-type .card-value").innerText =
    data.TypeOfWork || "N/A";

  const lat =
    data.ProjectLatitude !== "N/A"
      ? parseFloat(data.ProjectLatitude).toFixed(5)
      : "N/A";
  const lng =
    data.ProjectLongitude !== "N/A"
      ? parseFloat(data.ProjectLongitude).toFixed(5)
      : "N/A";

  document.querySelector("#project-location .card-value").innerText =
    `${lat}, ${lng}`;
};
