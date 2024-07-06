import {
  MAPBOX_API_KEY,
  MAP_CENTER,
  INITIAL_ZOOM,
  MIN_ZOOM,
  MAX_ZOOM,
  MAP_THEME,
  RADIUS,
  MARKER_SIZE,
  ANIMATION_SPEED,
} from "./config.js";

import toast from "./services/toast.js";

import {
  calculateDistance,
  getMapGraph,
  getNearestNode,
} from "./services/mapServices.js";

Toastify({
  text: "Left click at any point to add starting point and right click to add destination marker!",
  duration: 5000,
  newWindow: true,
  close: true,
  gravity: "bottom", // `top` or `bottom`
  position: "center", // `left`, `center` or `right`
  stopOnFocus: true, // Prevents dismissing of toast on hover
  style: {
    background: "linear-gradient(to right, #fe53bb, #8f51ea)",
    borderRadius: "3px",
  },
  className: "info",
  onClick: function () {}, // Callback after click
}).showToast();

// Initialize Leaflet map
var map = L.map("map", {
  center: MAP_CENTER, // Center coordinates for New Delhi
  zoom: INITIAL_ZOOM,
  maxZoom: MAX_ZOOM, // Maximum zoom level
  minZoom: MIN_ZOOM, // Minimum zoom level to fill the screen
});

// Add dark mode tile layer
L.tileLayer(
  `https://api.mapbox.com/styles/v1/mapbox/${MAP_THEME}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_API_KEY}`,
  {
    maxZoom: MAX_ZOOM,
    minZoom: MIN_ZOOM,
    tileSize: 512,
    zoomOffset: -1,
    accessToken: MAPBOX_API_KEY, // Replace with your Mapbox API token
  }
).addTo(map);

let startCoords, endCoords;
let startMarker, endMarker;
let circle;
let mapGraph;

map.on("click", async (e) => {
  let coords = e.latlng;

  mapGraph = await getMapGraph(coords);
  if (!mapGraph.startNode) {
    toast("No routes available nearby! Please choose another location!");
  } else {
    startCoords = [mapGraph.startNode.latitude, mapGraph.startNode.longitude];
    console.log(mapGraph);
    console.log(coords);
    console.log(startCoords);

    if (startMarker) {
      map.removeLayer(startMarker);
      startMarker = null;
    }
    if (endMarker) {
      map.removeLayer(endMarker);
      endMarker = null;
    }
    if (circle) {
      map.removeLayer(circle);
      circle = null;
    }
    map.eachLayer(function (layer) {
      if (layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    startMarker = L.marker(startCoords, {
      icon: L.divIcon({
        className: "custom-div-icon",
        html: '<div class="custom-marker"></div>',
        iconSize: [MARKER_SIZE, MARKER_SIZE],
        iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2],
      }),
    }).addTo(map);

    circle = L.circle(startCoords, {
      radius: RADIUS,
      color: "#ff5f1f31",
      fillOpacity: 0.2,
    }).addTo(map);
  }
});

map.on("contextmenu", async function (e) {
  if (endMarker) {
    map.removeLayer(endMarker);
    endMarker = null;
  }

  if (!startMarker) {
    toast("Please choose a starting point first!");
  } else {
    map.eachLayer(function (layer) {
      if (layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    let coords = e.latlng;
    let nearestNode = await getNearestNode(mapGraph, coords);
    endCoords = [nearestNode.latitude, nearestNode.longitude];

    var origin = startMarker.getLatLng();
    var dest = [nearestNode.latitude, nearestNode.longitude];
    var distance = origin.distanceTo(dest);

    if (distance > RADIUS) {
      toast(
        "Please place the final point within the radius of the initial point!"
      );
    } else {
      endMarker = L.marker(endCoords, {
        icon: L.divIcon({
          className: "custom-dest-icon",
          html: '<div class="custom-marker dest-marker"></div>',
          iconSize: [MARKER_SIZE, MARKER_SIZE],
          iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2],
        }),
      }).addTo(map);
    }
  }
});

document.getElementById("generate-btn").addEventListener("click", function () {
  if (!startMarker || !endMarker)
    toast("Please choose starting and ending points!");
  else solveWithAStarAlgorithm();
});

function solveWithAStarAlgorithm() {
  console.log(endCoords);
  // console.log(mapGraph.nodes);
  for (let [key, value] of mapGraph.nodes) {
    value.distanceToEnd = calculateDistance(
      value.latitude,
      value.longitude,
      endCoords[0],
      endCoords[1]
    );
    value.distanceFromStart = Infinity;
  }

  mapGraph.startNode.distanceFromStart = 0;

  let open = [],
    closed = [];

  let prevNode = null;

  let dryRun = [];
  let path = [];

  open.push(mapGraph.startNode);

  let fl = true;

  while (true) {
    if (open.length === 0) {
      fl = false;
      console.log("No path exists!");
      toast("No path exists!");
      break;
    }

    let cost = Infinity;
    let current;
    let index = 0;

    for (let i = 0; i < open.length; i++) {
      if (open[i].totalDistance <= cost) {
        cost = open[i].totalDistance;
        current = open[i];
        index = i;
      }
    }

    // console.log(current.distanceToEnd);

    open.splice(index, 1);
    closed.push(current);

    let temp = [];

    if (current.parent) {
      temp.push([current.latitude, current.longitude]);
      temp.push([current.parent.latitude, current.parent.longitude]);
      temp.push([current.latitude, current.longitude]);

      dryRun.push(temp);
    }

    if (
      current.latitude === endCoords[0] &&
      current.longitude === endCoords[1]
    ) {
      console.log("Path found!");
      let curr = current;

      path.push([curr.latitude, curr.longitude]);

      while (curr.parent) {
        path.push([curr.latitude, curr.longitude]);
        curr = curr.parent;
      }
      path.push([curr.latitude, curr.longitude]);
      break;
    }

    for (let i = 0; i < current.edges.length; i++) {
      let neighbour = current.edges[i].getOtherNode(current);
      if (closed.includes(neighbour)) continue;

      let dist = calculateDistance(
        neighbour.latitude,
        neighbour.longitude,
        current.latitude,
        current.longitude
      );

      if (
        current.distanceFromStart + dist < neighbour.distanceFromStart ||
        !open.includes(neighbour)
      ) {
        neighbour.distanceFromStart = current.distanceFromStart + dist;
        neighbour.parent = current;
        if (!open.includes(neighbour)) {
          open.push(neighbour);
        }
      }
    }
    prevNode = current;
  }

  map.eachLayer(function (layer) {
    if (layer instanceof L.Polyline) {
      map.removeLayer(layer);
    }
  });

  if (fl) {
    let time = ANIMATION_SPEED * 20;

    for (let i = 0; i < dryRun.length; i++) {
      time = time + ANIMATION_SPEED * 20;
      setTimeout(() => {
        drawPolylineSmoothly(map, dryRun[i], "rgba(255,0,0,0.4)", 1);
      }, time);
    }

    setTimeout(() => {
      drawPolylineSmoothly(map, path.reverse(), "#FF5F1F", 4, 50);
    }, time);
  }
}

function drawPolylineSmoothly(
  map,
  path,
  color = "blue",
  weight = 1,
  interval = ANIMATION_SPEED * 20
) {
  let points = path;

  let polyline = L.polyline([], {
    color: color,
    weight: weight,
    className: "glow",
  }).addTo(map);

  let index = 0;
  let intervalId = setInterval(() => {
    if (index < points.length - 1) {
      polyline.addLatLng(points[index]);
      index++;
    } else {
      clearInterval(intervalId);
    }
  }, interval);
}
