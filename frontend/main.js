const socket = io();

// Initialize Leaflet.js map focused on Chandigarh, India
const map = L.map('map').setView([30.7333, 76.7794], 13);  // Chandigarh's coordinates
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let startPoint, endPoint;
let floodMarkers = [];  // Array to store flood fill circles
let finalPolyline = null;

// Handle map click for selecting start and end points
map.on('click', function (e) {
    if (!startPoint) {
        startPoint = e.latlng;
        L.marker(startPoint).addTo(map).bindPopup("Start Point").openPopup();
    } else if (!endPoint) {
        endPoint = e.latlng;
        L.marker(endPoint).addTo(map).bindPopup("End Point").openPopup();
    }
});

// A* algorithm button event
document.getElementById('aStar').addEventListener('click', function () {
    console.log("A* Algorithm button clicked");
    if (startPoint && endPoint) {
        clearPaths();  // Clear previous paths
        socket.emit('findRoute', { start: [startPoint.lat, startPoint.lng], end: [endPoint.lat, endPoint.lng], algorithm: 'a_star' });
    }
});

// Dijkstra algorithm button event
document.getElementById('dijkstra').addEventListener('click', function () {
    console.log("Dijkstra's Algorithm button clicked");
    if (startPoint && endPoint) {
        clearPaths();  // Clear previous paths
        socket.emit('findRoute', { start: [startPoint.lat, startPoint.lng], end: [endPoint.lat, endPoint.lng], algorithm: 'dijkstra' });
    }
});

// Clear all previous paths and markers
function clearPaths() {
    if (finalPolyline) {
        map.removeLayer(finalPolyline);
        finalPolyline = null;
    }

    // Remove all flood fill markers
    floodMarkers.forEach(marker => map.removeLayer(marker));
    floodMarkers = [];  // Reset the markers array
}

// Handle real-time updates for pathfinding progress (Flood Fill Effect)
socket.on('progress', (data) => {
    const latlng = [data.lat, data.lng];
    console.log("Progress received: ", latlng);  // Debugging log

    // Create a flood fill circle for the current node
    const floodMarker = L.circle(latlng, {
        color: 'blue',
        fillColor: '#30a0ff',
        fillOpacity: 0.3,  // Semi-transparent to create the "flood" effect
        radius: 10
    }).addTo(map);

    floodMarkers.push(floodMarker);  // Store the marker so it can be cleared later
});

// Handle completion of pathfinding
socket.on('done', (path) => {
    console.log('Pathfinding completed:', path);

    // Remove all flood fill markers once pathfinding is complete
    floodMarkers.forEach(marker => map.removeLayer(marker));
    floodMarkers = [];  // Clear the array

    // Draw the final path on the map in green
    finalPolyline = L.polyline(path.map(p => [p.lat, p.lng]), { color: 'green', weight: 5 }).addTo(map);
});
