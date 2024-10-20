import heapq
import osmnx as ox
import networkx as nx

# A* Algorithm with progress updates
def a_star(graph, start_node, end_node, progress_callback):
    open_set = [(0, start_node)]
    came_from = {}
    g_score = {start_node: 0}
    f_score = {start_node: ox.distance.euclidean(
        graph.nodes[start_node]['y'], graph.nodes[start_node]['x'], 
        graph.nodes[end_node]['y'], graph.nodes[end_node]['x'])}

    visited_nodes = set()  # To track nodes we've visited
    
    while open_set:
        current = heapq.heappop(open_set)[1]
        
        # Send progress back to the frontend for visualization
        progress_callback(current)  # Only pass the current node

        if current == end_node:
            return reconstruct_path(came_from, current)

        if current in visited_nodes:
            continue

        visited_nodes.add(current)

        for neighbor in graph.neighbors(current):
            tentative_g_score = g_score[current] + graph.edges[current, neighbor, 0]['length']
            if tentative_g_score < g_score.get(neighbor, float('inf')):
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g_score
                f_score[neighbor] = tentative_g_score + ox.distance.euclidean(
                    graph.nodes[neighbor]['y'], graph.nodes[neighbor]['x'], 
                    graph.nodes[end_node]['y'], graph.nodes[end_node]['x'])
                heapq.heappush(open_set, (f_score[neighbor], neighbor))

    return None

# Dijkstra Algorithm with progress updates
def dijkstra(graph, start_node, end_node, progress_callback):
    distances = {node: float('inf') for node in graph.nodes}
    distances[start_node] = 0
    pq = [(0, start_node)]
    came_from = {}

    visited_nodes = set()  # To track nodes we've visited

    while pq:
        current_distance, current_node = heapq.heappop(pq)

        # Send progress back to the frontend for visualization
        progress_callback(current_node)  # Only pass the current node

        if current_node == end_node:
            return reconstruct_path(came_from, current_node)

        if current_node in visited_nodes:
            continue

        visited_nodes.add(current_node)

        for neighbor in graph.neighbors(current_node):
            weight = graph.edges[current_node, neighbor, 0]['length']
            distance = current_distance + weight

            if distance < distances[neighbor]:
                distances[neighbor] = distance
                heapq.heappush(pq, (distance, neighbor))
                came_from[neighbor] = current_node

    return None

# Reconstruct path from the 'came_from' dictionary
def reconstruct_path(came_from, current):
    path = []
    while current in came_from:
        path.insert(0, current)
        current = came_from[current]
    path.insert(0, current)  # Insert the start node
    return path
