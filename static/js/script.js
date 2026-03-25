const getRiskColor = (level) => {
    // TODO: Better colors
    const colors = {
        3: "#ff0000",
        2: "#ffff00",
        1: "#00ff00",
    };

    // Gray by default
    return colors[level] || "#808080"
};

// Coordinates: [12.8797, 121.7740], Zoom level: 6
document.addEventListener('DOMContentLoaded', () => {
    //print(geojsonData)

    const map = L.map('map').setView([12.8797, 121.7740], 6);

    L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png', {
        attribution: '© Stadia Maps, © Stamen Design, © OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);

    projectData.forEach(proj => {
        const color = getRiskColor(proj.RiskLevel)

        L.circleMarker([proj.ProjectLatitude, proj.ProjectLongitude], {
            radius: 6,
            fillColor: color,
            color: "#fff",
            weight: 1,
            fillOpacity: 0.8
        })
        .addTo(map)
        .bindPopup(`
            <strong>${proj.ProjectName}</strong><br>
            Budget: ₱${proj.ApprovedBudgetForContract.toLocaleString()}<br>
            Flood risk: ${proj.RiskLevel}
        `);
    });
});
