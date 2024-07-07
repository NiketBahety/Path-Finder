import Graph from "../models/Graph.js";
import fetchRoadInfo from "./fetchRoadInfo.js";

export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const lat1Rad = (lat1 * Math.PI) / 180; // Convert latitude 1 to radians
  const lat2Rad = (lat2 * Math.PI) / 180; // Convert latitude 2 to radians
  const lon1Rad = (lon1 * Math.PI) / 180; // Convert longitude 1 to radians
  const lon2Rad = (lon2 * Math.PI) / 180; // Convert longitude 2 to radians

  // Haversine formula
  const distance =
    Math.acos(
      Math.sin(lat1Rad) * Math.sin(lat2Rad) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.cos(lon2Rad - lon1Rad)
    ) * R;

  return distance; // Distance in kilometers
}

export async function getNearestNode(graph, coords) {
  let nearestNode = null;
  let minDistance = Infinity;

  for (let [key, value] of graph.nodes) {
    let dist = calculateDistance(
      coords.lat,
      coords.lng,
      value.latitude,
      value.longitude
    );
    if (dist <= minDistance) {
      minDistance = dist;
      nearestNode = value;
    }
  }

  return nearestNode;
}

export async function getMapGraph(coords, RADIUS) {
  let roadInfo = await (await fetchRoadInfo(RADIUS, coords)).json();
  let elements = roadInfo.elements;

  let nearestNode = null;
  let minDistance = Infinity;

  for (let i = 0; i < elements.length; i++) {
    let element = elements[i];
    if (element.type === "node") {
      let dist = calculateDistance(
        element.lat,
        element.lon,
        coords.lat,
        coords.lng
      );
      if (dist <= minDistance) {
        minDistance = dist;
        nearestNode = element;
      }
    }
  }

  let mapGraph = new Graph();

  for (let el of elements) {
    if (el.type === "node") {
      let node = mapGraph.addNode(el.id, el.lat, el.lon);

      if (node.id === nearestNode.id) {
        mapGraph.startNode = node;
      }
    }
  }
  for (let el of elements) {
    if (el.type === "way") {
      if (!el.nodes || el.nodes.length < 2) continue;

      for (let i = 0; i < el.nodes.length - 1; i++) {
        const node1 = mapGraph.getNode(el.nodes[i]);
        const node2 = mapGraph.getNode(el.nodes[i + 1]);

        if (!node1 || !node2) {
          continue;
        }

        node1.connectTo(node2);
      }
    }
  }

  return mapGraph;
}
