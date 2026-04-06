import { initializeCharts } from "./chart.js";
import { getProjectRegionData } from "./data.js";

const markers = new Map();


document.addEventListener("DOMContentLoaded", async () => {
  const { projectData, regionData } = await getProjectRegionData();

  const viewCavite = [[14.3456, 120.9365], 11];
  const worldMap = L.map("map").setView(...viewCavite);

  const riskLayers = {
    1: L.layerGroup(),
    2: L.layerGroup(),
    3: L.layerGroup()
  };

   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
    }).addTo(worldMap);

  projectData.forEach((project) => markProjectToMap(project, worldMap, riskLayers));
  Object.values(riskLayers).forEach((layer) => layer.addTo(worldMap))

  initializeCharts(regionData);
  initializeToggleButtons(worldMap, riskLayers);

  worldMap.invalidateSize();
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

const markProjectToMap = (proj, worldMap, riskLayers) => {
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
  marker.bindPopup(popupHTML);
  markers.set(proj.ProjectId, marker);

  let layer;
  if (layer = riskLayers[proj.RiskLevel]) {
    layer.addLayer(marker);
  } else {
    // TODO: Could add another layer to fallback to instead of direct to map
    marker.addTo(worldMap);
  } 
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


const updateProvinceStatsPanel = (data) => {
  toggleStatsView("province");

  document.getElementById("province-name").innerText = data.Province || "Unknown Province";

  const budgetVal = document.querySelector("#province-budget .card-value");
  budgetVal.innerText = data.TotalBudget 
    ? `₱${data.TotalBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    : "N/A";

  const countVal = document.querySelector("#province-project-count .card-value");
  countVal.innerText = data.ProjectCount || 0;

  const avgCostVal = document.querySelector("#province-average-cost-per-project .card-value");
  if (data.TotalBudget && data.ProjectCount) {
    const averageCost = data.TotalBudget / data.ProjectCount;
    avgCostVal.innerText = `₱${averageCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    avgCostVal.innerText = "N/A";
  }

  const provinceRegionVal = document.querySelector("#province-region .card-value");
  if (data.Region) {
    provinceRegionVal.innerText = data.Region;
  } else {
    provinceRegionVal.innerText = "N/A";
  }
  
  const rbiMatrix = document.querySelector(".rbi-matrix");
  if (rbiMatrix && data.norm_risk !== undefined) {
    rbiMatrix.innerHTML = '<canvas id="rbmChart" style="width: 100%; height: 300px;"></canvas>';
    
    const ctx = document.getElementById('rbmChart').getContext('2d');
    
    new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: data.Province,
          data: [{ x: data.norm_risk, y: data.norm_budget }],
          backgroundColor: '#e8ff16ff',
          borderColor: '#fff',
          borderWidth: 2,
          pointRadius: 8,
          pointHoverRadius: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `RBI: ${data.Matrix_Scenario}`,
            color: '#fff'
          },
          legend: { display: false }
        },
        scales: {
          x: {
            min: 0, max: 1,
            title: { display: true, text: 'Risk Score (Norm)', color: '#aaa' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: '#888' }
          },
          y: {
            min: 0, max: 1,
            title: { display: true, text: 'Budget Level (Norm)', color: '#aaa' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: '#888' }
          }
        }
      }
    });
  } else if (rbiMatrix) {
      rbiMatrix.innerHTML = '<p style="color: gray; text-align: center;">No Matrix Data Available</p>';
  }
};

const listProvince = (provinceName, worldMap) => {
  const listContainer = document.querySelector(
    "#flood-control-projects-list"
  );
  const provinceListing = document.createElement("li");
  provinceListing.innerText = provinceName;
  provinceListing.dataset.provinceName = provinceName;

  provinceListing.onclick = async () => {
    const response = await fetch(`/api/province/${provinceName}`);

    if (response.ok) {
      const provDataArray = await response.json();
      const provData = provDataArray[0];
      
      if (provData) {
        updateProvinceStatsPanel(provData);
        
        if (provData.MinLat && provData.MaxLat && provData.MinLng && provData.MaxLng) {
          const provinceBounds = [
            [provData.MinLat, provData.MinLng],
            [provData.MaxLat, provData.MaxLng]
          ];
          
          worldMap.flyToBounds(provinceBounds, {
            maxZoom: 18
          });
        }
      }
    }
  };
  
  listContainer.appendChild(provinceListing);
};

const populateProvinceList = async (worldMap) => {
  clearProjectList();

  const response = await fetch(`/api/province/names`);
  
  if (response.ok) {
    const provinces = await response.json();

    provinces.forEach((provinceName) => {
      listProvince(provinceName, worldMap);
    });
  }
};

const initializeToggleButtons = (worldMap, riskLayers) => {
  const toggleBtns = document.getElementsByClassName("toggleBtn");
  const listPanel = document.getElementById("flood-control-projects");
  // const controls = document.querySelector(".list-controls");

  let activeType = null;
  listPanel.style.display = "none";
  // controls.style.display = "none";

  const toggleRiskLayer = (riskLevel, worldMap, btn) => {
    const layer = riskLayers[riskLevel]

    if (worldMap.hasLayer(layer)) {
      worldMap.removeLayer(layer)
      btn.classList.remove('active');
    } else {
      worldMap.addLayer(layer)
      btn.classList.add('active');
    }
  };

  Array.from(toggleBtns).forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;

      if (type.includes("risk")) {
        const riskLevel = parseInt(type.slice(-1));
        toggleRiskLayer(riskLevel, worldMap, btn);
        return;
      }

      if (activeType === type) {
        activeType = null;
        listPanel.style.display = "none";
        // controls.style.display = "none";
      } else {
        activeType = type;
        btn.classList.add("active");
        listPanel.style.display = "flex";
        // controls.style.display = "flex";
        if (type === "projects") {
          populateProjectsList(worldMap);
        } else if (type === "province") {
          populateProvinceList(worldMap);
        }
      }

      if (worldMap) worldMap.invalidateSize();
    });
  });
};

const updateProjectStatsPanel = (data) => {

  toggleStatsView("project");

  const idIndicator = document.getElementById("project-id");
  idIndicator.innerText = data.ProjectId || "N/A";

  idIndicator.className = "project-id-risk-indicator";
  if (data.RiskLevel === 3) idIndicator.classList.add("risk-level-high");
  else if (data.RiskLevel === 2) idIndicator.classList.add("risk-level-medium");
  else if (data.RiskLevel === 1) idIndicator.classList.add("risk-level-low");
  else idIndicator.classList.add("risk-level-unknown");

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


const toggleStatsView = (viewType) => {
  const projectPanel = document.getElementById("project-stats");
  const provincePanel = document.getElementById("province-stats");

  if (viewType === "project") {
    projectPanel.style.display = "flex";
    provincePanel.style.display = "none";
  } else if (viewType === "province") {
    projectPanel.style.display = "none";
    provincePanel.style.display = "flex";
  }
};