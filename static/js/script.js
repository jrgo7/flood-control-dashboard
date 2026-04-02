const getRiskColor = (level) => {
  // TODO: Better colors
  const colors = {
    3: "hsl(0, 100%, 50%)",
    2: "hsl(60, 100%, 50%)",
    1: "hsl(120, 100%, 50%)",
  };

  // Gray by default
  return colors[level] || "#808080";
};

const markers = new Map();

const markProjectToMap = (proj, map) => {
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
    `Flood risk: ${proj.RiskLevel}`;
  const marker = L.circleMarker(coordinates, style);
  marker.addTo(map);
  marker.bindPopup(popupHTML);
  markers.set(proj.ProjectName, marker);
};

const listProject = (proj, map) => {
  floodControlProjects = document.querySelector("#flood-control-projects-list");
  projectListing = document.createElement("li");
  projectListing.innerText = proj.ProjectName;
  projectListing.onclick = () => {
    map.flyTo([proj.ProjectLatitude, proj.ProjectLongitude], 18);
    markers.get(proj.ProjectName).openPopup();
  };
  floodControlProjects.appendChild(projectListing);
};


const setupViewButtons = () => {
  const buttons = document.querySelectorAll('#viewToggle button');

  buttons.forEach(button => {
    button.addEventListener('click', function () {
      buttons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      updateChartVisibility(this.dataset.view);
    });
  });
};

const toggleDropdown = (label, dropdown) => {
  label.addEventListener("click", () => {
    dropdown.classList.toggle("show");
  });
};

const closeDropdownsOnOutsideClick = () => {
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown-container")) {
      document.querySelectorAll(".dropdown")
        .forEach(d => d.classList.remove("show"));
    }
  });
};

const populateRegionDropdown = (regions, dropdown) => {
  regions.forEach(region => {
    const item = document.createElement("li");
    item.className = "dropdown-item has-checkbox region-checkbox";

    item.innerHTML = `
      <label class="custom-checkbox">
        <input type="checkbox" value="${region}">
        <span class="checkmark"></span>
        <span class="label-text">${region}</span>
      </label>
    `;

    dropdown.appendChild(item);
  });
};

const updateChartVisibility = (view) => {
  const budget = document.getElementById('budgetContainer');
  const count = document.getElementById('countContainer');

  if (!budget || !count) return;

  budget.style.display =
    (view === 'both' || view === 'budget') ? 'flex' : 'none';

  count.style.display =
    (view === 'both' || view === 'count') ? 'flex' : 'none';
};


const createBarChart = (canvasId, labels, data, labelText, barColor) => {
  return new Chart(document.getElementById(canvasId), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: labelText,
        data: data,
        backgroundColor: barColor,
        hoverBackgroundColor: "hsl(120, 40%, 48%)",
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { 
          beginAtZero: true, 
          grid: { color: "hsl(0, 0%, 24%)" },
          ticks: { color: "#fff" } 
        },
        x: {
          grid: { display: false },
          ticks: { 
            font: { size: 9 },
            maxRotation: 45,
            minRotation: 45,
            color: "#fff"
          }
        }
      },
      plugins: { legend: { display: false } },
    }
  });
};

/* CHart wiring */
let map;
let budgetChartInstance = null;
let countChartInstance = null;

let activeRegions = new Set();
let currentSort = 'default';

const updateCharts = () => {
  let data = regions.map((r, i) => ({
    region: r,
    budget: avgBudget[i],
    count: projectCount[i]
  }));

  if (activeRegions.size > 0) {
    data = data.filter(d => activeRegions.has(d.region));
  }

  if (currentSort === 'highest_budget') {
    data.sort((a, b) => b.budget - a.budget);
  } else if (currentSort === 'lowest_budget') {
    data.sort((a, b) => a.budget - b.budget);
  } else if (currentSort === 'highest_count') {
    data.sort((a, b) => b.count - a.count);
  } else if (currentSort === 'lowest_count') {
    data.sort((a, b) => a.count - b.count);
  }

  const newLabels = data.map(d => d.region);
  const newBudgets = data.map(d => d.budget);
  const newCounts = data.map(d => d.count);

  if (budgetChartInstance) {
    budgetChartInstance.data.labels = newLabels;
    budgetChartInstance.data.datasets[0].data = newBudgets;
    budgetChartInstance.update();
  }

  if (countChartInstance) {
    countChartInstance.data.labels = newLabels;
    countChartInstance.data.datasets[0].data = newCounts;
    countChartInstance.update();
  }
};

const setupRegionFilter = () => {
  const checkboxes = document.querySelectorAll('.region-checkbox input[type="checkbox"]');
  const clearBtn = document.querySelector('li[value="clear"]');

  checkboxes.forEach(cb => {
    cb.addEventListener('change', (e) => {
      if (e.target.checked) {
        activeRegions.add(e.target.value);
      } else {
        activeRegions.delete(e.target.value);
      }
      updateCharts();
    });
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      activeRegions.clear();
      checkboxes.forEach(c => c.checked = false);
      document.getElementById('regionDropdown').classList.remove('show');
      updateCharts();
    });
  }
  
};

const setupSortDropdown = () => {
  const sortItems = document.querySelectorAll('#sortDropdown .dropdown-item');
  const sortLabel = document.getElementById('sortDropdownLabel');

  sortItems.forEach(item => {
    item.addEventListener('click', (e) => {
      currentSort = item.getAttribute('value');
      
      sortLabel.innerText = item.innerText; 

      document.getElementById('sortDropdown').classList.remove('show');
      
      updateCharts();
    });
  });
};

document.addEventListener("DOMContentLoaded", () => {
  //print(geojsonData)

  // [longitude, latitude], zoom level
  // viewPhilippines = [[12.8797, 121.7740], 6];
  viewCavite = [[14.3456, 120.9365], 11];

  map = L.map("map").setView(...viewCavite);

  L.tileLayer(
    "https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png",
    {
      attribution:
        "© Stadia Maps, © Stamen Design, © OpenStreetMap contributors",
      maxZoom: 18,
    },
  ).addTo(map);

  projectData.forEach((proj) => {
    markProjectToMap(proj, map);
    listProject(proj, map);
  });

  budgetChartInstance = createBarChart("budgetChart", regions, avgBudget, "Avg Budget", "hsl(120, 40%, 32%)");
  countChartInstance = createBarChart("countChart", regions, projectCount, "Projects", "hsl(120, 40%, 32%)");

  setupViewButtons();

  const regionDropdown = document.getElementById("regionDropdown");
  const regionLabel = document.getElementById("regionDropdownLabel");

  const sortDropdown = document.getElementById("sortDropdown");
  const sortLabel = document.getElementById("sortDropdownLabel");

  populateRegionDropdown(regions, regionDropdown);

  toggleDropdown(regionLabel, regionDropdown);
  toggleDropdown(sortLabel, sortDropdown);
  closeDropdownsOnOutsideClick();

  setupRegionFilter();
  setupSortDropdown();

});

// TODO: I guess, uhh create a dropdown class. to be used in Filter and sort in Region stats and List