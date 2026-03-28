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

document.addEventListener("DOMContentLoaded", () => {
  //print(geojsonData)

  // [longitude, latitude], zoom level
  // viewPhilippines = [[12.8797, 121.7740], 6];
  viewCavite = [[14.3456, 120.9365], 11];

  const map = L.map("map").setView(...viewCavite);

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
});
