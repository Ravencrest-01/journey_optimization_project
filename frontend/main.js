const socket = io();

// Initialize Leaflet.js map focused on Chandigarh, India
const map = L.map('map').setView([30.7333, 76.7794], 13);  // Chandigarh's coordinates
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let startPoint, endPoint;
let traversalPolyline = null; // Store the traversal polyline
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

// Clear all previous paths
function clearPaths() {
    if (finalPolyline) {
        map.removeLayer(finalPolyline);
        finalPolyline = null;
    }

    // Clear traversal polyline
    if (traversalPolyline) {
        map.removeLayer(traversalPolyline);
        traversalPolyline = null;
    }
}

// Handle real-time updates for pathfinding progress
socket.on('progress', (data) => {
    const latlng = [data.lat, data.lng];
    console.log("Progress received: ", latlng);  // Debugging log

    // If no traversal polyline exists, create one, otherwise add to the existing line
    if (!traversalPolyline) {
        traversalPolyline = L.polyline([latlng], { color: 'blue', opacity: 0.5 }).addTo(map);  // Set opacity to 0.5 for translucency
    } else {
        traversalPolyline.addLatLng(latlng); // Add new points to the polyline to visualize the path
    }
});

// Handle completion of pathfinding
socket.on('done', (path) => {
    console.log('Pathfinding completed:', path);

    // Remove the traversal polyline and show the final path in green
    if (traversalPolyline) {
        map.removeLayer(traversalPolyline);
    }

    // Draw the final path on the map
    finalPolyline = L.polyline(path.map(p => [p.lat, p.lng]), { color: 'green', weight: 5 }).addTo(map);
});
