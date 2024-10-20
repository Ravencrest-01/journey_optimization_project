const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const axios = require('axios');

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static('../frontend'));

// WebSocket connection for real-time updates
io.on('connection', (socket) => {
    console.log('User connected');

    socket.on('findRoute', async (data) => {
        const { start, end, algorithm } = data;
        console.log(`Received findRoute request for ${algorithm} from ${start} to ${end}`);

        try {
            // Communicate with the Python backend
            const response = await axios.post('http://localhost:5000/find_route', { start, end, algorithm });

            const path = response.data.path;
            const steps = response.data.steps;

            console.log("Path and steps received from backend:", path, steps);

            // Emit real-time progress of pathfinding
            for (let step of steps) {
                socket.emit('progress', step);
                await new Promise(resolve => setTimeout(resolve, 100));  // Simulate delay
            }

            // Emit the final path once done
            socket.emit('done', path);
        } catch (error) {
            console.error("Error fetching route from backend:", error);  // Log any error
            socket.emit('error', { message: "Error fetching route from backend" });
        }
    });
});

server.listen(3000, () => {
    console.log('Node server listening on port 3000');
});
