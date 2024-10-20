from flask import Flask, request, jsonify
from algorithms import a_star, dijkstra
import osmnx as ox
import logging
import os

# Initialize Flask app
app = Flask(__name__)

# Enable logging to see incoming requests and debug messages
logging.basicConfig(level=logging.INFO)

GRAPH_FILE = 'chandigarh_walk_graph.graphml'

# Load or download the graph for Chandigarh
def load_graph():
    if os.path.exists(GRAPH_FILE):
        logging.info("Loading graph from local file...")
        return ox.load_graphml(GRAPH_FILE)
    else:
        logging.info("Downloading graph of Chandigarh from OSM and saving locally...")
        graph = ox.graph_from_place("Chandigarh, India", network_type='walk')
        ox.save_graphml(graph, GRAPH_FILE)
        return graph

graph = load_graph()

@app.route('/find_route', methods=['POST'])
def find_route():
    data = request.json
    logging.info(f"Received request: {data}")

    start_coords = data['start']
    end_coords = data['end']
    algorithm = data['algorithm']

    try:
        start_node = ox.distance.nearest_nodes(graph, start_coords[1], start_coords[0])
        end_node = ox.distance.nearest_nodes(graph, end_coords[1], end_coords[0])
        logging.info(f"Start node: {start_node}, End node: {end_node}")
    except Exception as e:
        logging.error(f"Error finding nearest nodes: {e}")
        return jsonify({'error': 'Could not find nearest nodes'}), 500

    steps = []
    report_frequency = 60  # Send every nth node during traversal
    step_counter = 2  # Counter to manage reporting frequency

    # Progress callback to record each step (reduce steps reported by using report_frequency)
    def progress_callback(node):
        nonlocal step_counter
        step_counter += 1
        if step_counter % report_frequency == 0:
            steps.append({
                'lat': graph.nodes[node]['y'],
                'lng': graph.nodes[node]['x']
            })
            logging.info(f"Step progress: Node {node}, Coordinates: ({graph.nodes[node]['y']}, {graph.nodes[node]['x']})")

    try:
        if algorithm == 'a_star':
            path = a_star(graph, start_node, end_node, progress_callback)
        elif algorithm == 'dijkstra':
            path = dijkstra(graph, start_node, end_node, progress_callback)
        else:
            return jsonify({'error': 'Invalid algorithm'}), 400

        logging.info(f"Full path: {path}")
        logging.info(f"Steps during traversal: {steps}")

        return jsonify({
            'path': [{'lat': graph.nodes[node]['y'], 'lng': graph.nodes[node]['x']} for node in path],
            'steps': steps  # Reduced steps for real-time progress visualization
        })
    except Exception as e:
        logging.error(f"Error during pathfinding: {e}")
        return jsonify({'error': 'Pathfinding failed'}), 500

if __name__ == '__main__':
    app.run(debug=True)
