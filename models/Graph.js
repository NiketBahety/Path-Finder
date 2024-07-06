import Node from "./Node.js";

export default class Graph {
  constructor() {
    this.startNode = null;
    this.nodes = new Map();
  }

  getNode(id) {
    return this.nodes.get(id);
  }

  addNode(id, lat, lng) {
    const node = new Node(id, lat, lng);
    this.nodes.set(id, node);

    return node;
  }
}
