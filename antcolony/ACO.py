#!/usr/bin/env python3
"""
Ant Colony Optimization for waypoint path generation.
Generates a best path and outputs JSON.
Usage: python aco.py [--input graph.json] [--ants N] [--iterations M] [--alpha A] [--beta B] [--rho R] [--Q Q]
"""
import argparse
import json
import numpy as np
import sys

def parse_args():
    parser = argparse.ArgumentParser(description="Ant Colony Optimization for waypoint path generation")
    parser.add_argument('--input', type=str, help='Path to JSON file with nodes list', default=None)
    parser.add_argument('--ants', type=int, help='Number of ants', default=20)
    parser.add_argument('--iterations', type=int, help='Number of iterations', default=100)
    parser.add_argument('--alpha', type=float, help='Pheromone importance', default=1.0)
    parser.add_argument('--beta', type=float, help='Heuristic importance', default=5.0)
    parser.add_argument('--rho', type=float, help='Pheromone evaporation rate', default=0.5)
    parser.add_argument('--Q', type=float, help='Pheromone deposit factor', default=100.0)
    return parser.parse_args()

def load_nodes(path):
    with open(path) as f:
        data = json.load(f)
        return data.get('nodes', [])

def compute_distances(nodes):
    n = len(nodes)
    dist = np.zeros((n, n))
    for i in range(n):
        xi, yi = nodes[i]
        for j in range(n):
            xj, yj = nodes[j]
            dist[i, j] = np.hypot(xi - xj, yi - yj)
    return dist

def aco(dist, args):
    n = dist.shape[0]
    tau = np.ones((n, n))
    eta = 1 / (dist + 1e-6)
    best_path, best_len = None, float('inf')
    for _ in range(args.iterations):
        paths = []
        lengths = []
        for _ in range(args.ants):
            start = np.random.randint(n)
            visited = [start]
            while len(visited) < n:
                curr = visited[-1]
                probs = []
                for j in range(n):
                    if j in visited:
                        probs.append(0)
                    else:
                        probs.append((tau[curr, j] ** args.alpha) * (eta[curr, j] ** args.beta))
                probs = np.array(probs)
                if probs.sum() == 0:
                    choices = [j for j in range(n) if j not in visited]
                    next_node = np.random.choice(choices)
                else:
                    probs = probs / probs.sum()
                    next_node = np.random.choice(range(n), p=probs)
                visited.append(next_node)
            length = sum(dist[visited[i], visited[i + 1]] for i in range(n - 1)) + dist[visited[-1], visited[0]]
            paths.append(visited)
            lengths.append(length)
            if length < best_len:
                best_len = length
                best_path = visited
        tau *= (1 - args.rho)
        for path, length in zip(paths, lengths):
            for i in range(n - 1):
                tau[path[i], path[i + 1]] += args.Q / length
            tau[path[-1], path[0]] += args.Q / length
    return best_path, best_len

def main():
    args = parse_args()
    if args.input:
        nodes = load_nodes(args.input)
    else:
        # Default random nodes if none provided
        nodes = [(float(x), float(y)) for x, y in np.random.rand(10, 2) * 10]
    if not nodes:
        print(json.dumps({"error": "No nodes provided"}))
        sys.exit(1)
    dist = compute_distances(nodes)
    path, length = aco(dist, args)
    result = {
        "best_path": [{"x": nodes[i][0], "y": nodes[i][1]} for i in path],
        "length": length
    }
    print(json.dumps(result))

if __name__ == "__main__":
    main()
