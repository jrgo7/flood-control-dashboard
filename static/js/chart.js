import Dropdown from "./dropdown.js";

export const initializeCharts = (initialRegionData) => {
  const budgetChart = createBarChart(
    "budgetChart",
    initialRegionData.names,
    initialRegionData.avg_budget,
    "Avg Budget",
    "hsl(120, 40%, 32%)",
  );
  const countChart = createBarChart(
    "countChart",
    initialRegionData.names,
    initialRegionData.project_count,
    "Projects",
    "hsl(120, 40%, 32%)",
  );

  setupViewButtons();

  // Dropdowns

  const activeRegions = new Set();
  let currentSort = "default";


  const regionDropdown = new Dropdown("regionDropdownLabel", "regionDropdown");
  const updateRegion = (region, isChecked) => {
    if (region === "clear") {
      activeRegions.clear();
    } else {
      isChecked ? activeRegions.add(region) : activeRegions.delete(region);
    }
    fetchAndUpdateCharts(budgetChart, countChart, currentSort, activeRegions);
  };
  regionDropdown.populateCheckboxes(initialRegionData.names, updateRegion);

  const sortDropdown = new Dropdown("sortDropdownLabel", "sortDropdown");
  const updateSort = (sortValue) => {
    currentSort = sortValue;
    fetchAndUpdateCharts(budgetChart, countChart, currentSort, activeRegions);
  };
  sortDropdown.hookUpSortItems(updateSort);
};

const createBarChart = (canvasId, labels, data, labelText, barColor) => {
  return new Chart(document.getElementById(canvasId), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: labelText,
          data: data,
          backgroundColor: barColor,
          hoverBackgroundColor: "hsl(120, 40%, 48%)",
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "hsl(0, 0%, 24%)" },
          ticks: { color: "#fff" },
        },
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 9 },
            maxRotation: 45,
            minRotation: 45,
            color: "#fff",
          },
        },
      },
      plugins: { legend: { display: false } },
    },
  });
};

const setupViewButtons = () => {
  const buttons = document.querySelectorAll("#viewToggle button");
  buttons.forEach((button) => {
    button.addEventListener("click", function () {
      buttons.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");
      updateChartVisibility(this.dataset.view);
    });
  });
};

const updateChartVisibility = (view) => {
  const budget = document.getElementById("budgetContainer");
  const count = document.getElementById("countContainer");

  if (!budget || !count) return;

  budget.style.display = view === "both" || view === "budget" ? "flex" : "none";
  count.style.display = view === "both" || view === "count" ? "flex" : "none";
};

export const fetchAndUpdateCharts = async (
  budgetChart,
  countChart,
  currentSort,
  activeRegions,
) => {
  const params = new URLSearchParams();

  if (currentSort !== "default") {
    params.append("sort", currentSort);
  }

  if (activeRegions.size > 0) {
    params.append("regions", Array.from(activeRegions).join(","));
  }

  try {
    const res = await fetch(`/api/regions?${params.toString()}`);
    const data = await res.json();
    console.debug(res);

    if (budgetChart) {
      budgetChart.data.labels = data.names;
      budgetChart.data.datasets[0].data = data.avg_budget;
      budgetChart.update();
    } else {
      console.warn("Budget chart not found");
    }

    if (countChart) {
      countChart.data.labels = data.names;
      countChart.data.datasets[0].data = data.project_count;
      countChart.update();
    } else {
      console.warn("Count chart not found");
    }
  } catch (err) {
    console.error(err);
  }
};

export default { initializeCharts, fetchAndUpdateCharts };
