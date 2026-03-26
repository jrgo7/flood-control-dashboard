const getRiskColor = (level) => {
    // TODO: Better colors 
    // QUERY: hb red, orange, yellow -> green might signify that everything is ok
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
            color: "#ffffffff",
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
    // TODO: display: flex the whole dashboard. IMPORTANT charts have infinite height, make sure to set a limit either it or it's parents
    createBarChart("budgetChart", regions, avgBudget, "Avg Budget");
    createBarChart("countChart", regions, projectCount, "Projects");
});

function createBarChart(canvasId, labels, data, labelText, barColor = "#00acc1") {
    return new Chart(document.getElementById(canvasId), {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: labelText,
                data: data,
                backgroundColor: barColor,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    beginAtZero: true, 
                    grid: { color: "#444" },
                    ticks: { color: "#fff" } 
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 9 }, maxRotation: 45, minRotation: 45, color: "#fff"  }
                }
            },
            plugins: { legend: { display: false } },
        }
    });
}
