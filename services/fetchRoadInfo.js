const highWayExclude = [
  "footway",
  "street_lamp",
  "steps",
  "pedestrian",
  "track",
  "path",
];

function fetchOverpassData(radius, latlng) {
  const exclusion = highWayExclude.map((e) => `[highway!="${e}"]`).join("");

  const query = `[out:json];
    way(around:${radius},${latlng.lat},${latlng.lng})["highway"]${exclusion}[footway!="*"];
    out body;
    >;
    out skel qt;`;

  return fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query,
  });
}

export default fetchOverpassData;
