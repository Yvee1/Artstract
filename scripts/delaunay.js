/**
 * Returns Coordinates of triangle around the input point set.
 */
 function getBoundingTriangle(P) {
  // Create triangle around P
  let minX = Number.MAX_VALUE;
  let maxX = Number.MIN_VALUE;
  let minY = Number.MAX_VALUE;
  let maxY = Number.MIN_VALUE;

  P.forEach(p => {
    minX = Math.min(p.x, minX);
    maxX = Math.max(p.x, maxX);
    minY = Math.min(p.y, minY);
    maxY = Math.max(p.y, maxY);
  });

  // make sure points are also not on the line
  minX -= 10; 
  maxX += 10; 
  minY -= 10; 
  maxY += 10; 

  const height = maxY - minY;
  const width = maxX - minX;
  // create coordinates
  const topLeftCoordinate = new Coordinate(minX-height, minY);
  const topRightCoordinate = new Coordinate(maxX+height, minY);
  // we try to get a 90 degree angle at the top using tan(theta) = o/a
  // so tan(pi/4) = 1 = half basis width/height
  const bottomCoordinate = new Coordinate((minX + maxX)/2, maxY + (width/2+height));

  return [topLeftCoordinate, topRightCoordinate, bottomCoordinate];
}

/**
 * Randomize array in-place using Durstenfeld shuffle algorithm
 *  
 * https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 */
function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
  }
}

/**
 * Class for search structure in Delaunay triangulation. 
 */
class TriangleSearchTreeNode {
  constructor(triangle) {
    this.triangle = triangle;
        this.deleted = false; // contains if triangle is search

    this.adjacentTriangleNodes = [];
    this.containing = false;
  }

  split(p, coordList) {
    const edge = this.triangle.getTriangleEdgeIfOnEdge(p, coordList);

    if (edge === null) {
      const t1 = new TriangleSearchTreeNode(new Triangle(p, this.triangle.v1, this.triangle.v2));
      const t2 = new TriangleSearchTreeNode(new Triangle(p, this.triangle.v1, this.triangle.v3));
      const t3 = new TriangleSearchTreeNode(new Triangle(p, this.triangle.v2, this.triangle.v3));

      // keep track of adjacent triangle nodes in triangle search tree node
      const e1 = new Edge(this.triangle.v1, this.triangle.v2);
      const adj1 = this.getAdjacentTriangleNode(e1);
      t1.setAdjacentTriangleNodes(t2, t3, adj1);
      if (adj1 != null) adj1.replaceAdjTriangle(this, t1);

      const e2 = new Edge(this.triangle.v1, this.triangle.v3);
      const adj2 = this.getAdjacentTriangleNode(e2);
      t2.setAdjacentTriangleNodes(t1, t3, adj2);
      if (adj2 !=null) adj2.replaceAdjTriangle(this, t2);

      const e3 = new Edge(this.triangle.v2, this.triangle.v3);
      const adj3 = this.getAdjacentTriangleNode(e3);
      t3.setAdjacentTriangleNodes(t1, t2, adj3);
      if (adj3 != null) adj3.replaceAdjTriangle(this, t3);

      this.descendants = [t1, t2, t3];
      this.deleted = true;

      // check for needed flips
      t1.legalize(e1, p, coordList);
      t2.legalize(e2, p, coordList);
      t3.legalize(e3, p, coordList);
    } else {
      // p lies on edge

      // get oppose vertex of edge which p lies on
      const edgeOpposite = this.triangle.getOppositeVertex(edge);

      // get adjacent triangle
      const adjTriangleNode = this.getAdjacentTriangleNode(edge);
      const adjTriangleVertex = adjTriangleNode.triangle.getOppositeVertex(edge);

      // update this
      const t1 = new TriangleSearchTreeNode(new Triangle(p, edge.u, edgeOpposite));
      const t2 = new TriangleSearchTreeNode(new Triangle(p, edge.v, edgeOpposite));
      this.descendants = [t1, t2];
      this.deleted = true;

      // update adjacent triangle
      const t3 = new TriangleSearchTreeNode(new Triangle(p, edge.u, adjTriangleVertex));
      const t4 = new TriangleSearchTreeNode(new Triangle(p, edge.v, adjTriangleVertex));
      adjTriangleNode.descendants = [t3, t4];
      adjTriangleNode.deleted = true;

      // set adjacent triangles correctly
      const e1 = new Edge(edge.u, edgeOpposite);
      const adj1 = this.getAdjacentTriangleNode(e1);
      t1.setAdjacentTriangleNodes(t2, t3, adj1);
      if (adj1 != null) adj1.replaceAdjTriangle(this, t1);

      const e2 = new Edge(edge.v, edgeOpposite);
      const adj2 = this.getAdjacentTriangleNode(e2);
      t2.setAdjacentTriangleNodes(t1, t4, adj2);
      if (adj2 !=null) adj2.replaceAdjTriangle(this, t2);

      const e3 = new Edge(edge.u, adjTriangleVertex);
      const adj3 = adjTriangleNode.getAdjacentTriangleNode(e3);
      t3.setAdjacentTriangleNodes(t1, t4, adj3);
      if (adj3 != null) adj3.replaceAdjTriangle(adjTriangleNode, t3);

      const e4 = new Edge(edge.v, adjTriangleVertex);
      const adj4 = adjTriangleNode.getAdjacentTriangleNode(e4);
      t4.setAdjacentTriangleNodes(t2, t3, adj4);
      if (adj4 != null) adj4.replaceAdjTriangle(adjTriangleNode, t4);

      t1.legalize(e1, p, coordList);
      t2.legalize(e2, p, coordList);
      t3.legalize(e3, p, coordList);
      t4.legalize(e4, p, coordList);
    }
  }

  replaceAdjTriangle(toReplace, adj) {
    if (this.adjacentTriangleNodes.length > 3) throw "this cannot be true";
    const index = this.adjacentTriangleNodes.indexOf(toReplace);
    if (index !== -1) {
      this.adjacentTriangleNodes[index] = adj;
    } else {
      throw "replace non existing"
    }
  }

  legalize(edge, p, coordList) {
    if (this.isIllegal(edge, coordList)) {
      // flip 
     
      // create new triangles
      const adjTriangleNode = this.getAdjacentTriangleNode(edge);
      const adjTriangleVertex = adjTriangleNode.triangle.getOppositeVertex(edge);
      const t1 = new TriangleSearchTreeNode(new Triangle(p, edge.u, adjTriangleVertex));
      const t2 = new TriangleSearchTreeNode(new Triangle(p, edge.v, adjTriangleVertex));

      // update search structure
      adjTriangleNode.flipped(t1, t2);
      this.flipped(t1, t2);

      // update adjacent triangles
      const adjT1 = this.getAdjacentTriangleNode(new Edge(p, edge.u));
      const adjT2 = this.getAdjacentTriangleNode(new Edge(p, edge.v));
      const adjT3 = adjTriangleNode.getAdjacentTriangleNode(new Edge(edge.u, adjTriangleVertex));
      const adjT4 = adjTriangleNode.getAdjacentTriangleNode(new Edge(edge.v, adjTriangleVertex));

      t1.setAdjacentTriangleNodes(t2, adjT1, adjT3);
      if (adjT1 != null) adjT1.replaceAdjTriangle(this, t1);
      if (adjT2 != null) adjT2.replaceAdjTriangle(this, t2);
      t2.setAdjacentTriangleNodes(t1, adjT2, adjT4);
      if (adjT3 != null) adjT3.replaceAdjTriangle(adjTriangleNode, t1);
      if (adjT4 != null) adjT4.replaceAdjTriangle(adjTriangleNode, t2);

      // recursively call legalize
      t1.legalize(new Edge(edge.u, adjTriangleVertex), p, coordList);
      t2.legalize(new Edge(edge.v, adjTriangleVertex), p, coordList);
    }
  }

  /** Updates tree node to point to legalized nodes. */
  flipped(node1, node2) {
    this.deleted = true;
    this.descendants = [node1, node2]
  }

  setAdjacentTriangleNodes(n1, n2, n3) {
    this.adjacentTriangleNodes = [n1, n2, n3].filter(n => n); // filter null out
  }

  /** Get adjacentTriangle search tree node given edge */
  getAdjacentTriangleNode(edge) {
    for (let i = 0; i < this.adjacentTriangleNodes.length; i++) {
      const node = this.adjacentTriangleNodes[i];
      const triangle = node.triangle;
      if (triangle.isInTriangle(edge)) {  // check if edge in triangle
        return node;
      }
    }
    return null;
  }

  /** Returns triangle which contains the point p */
  getTriangleNodeContaining(p, coordList) {
    if (p.isInTriangle(this.triangle, coordList)) {
      if (this.deleted) { // recurse through descendants
        for (let i = 0; i < this.descendants.length; i++) {
          const node = this.descendants[i];
          const triangleNode = node.getTriangleNodeContaining(p, coordList);
          if (triangleNode != false) {
            return triangleNode;
          }
        }
        console.log(this.triangle.toString(coordList));
        console.log(p)
        console.log(`Error occurred finding point ${p}`);
        for (let i = 0; i < this.descendants.length; i++) {
          const node = this.descendants[i];
          console.log(node.triangle.toString(coordList), p.isInTriangle(node.triangle, coordList));
        }
        throw "Should not be here."; // should always have at least one triangle containing the point unless not started at root node
      } else return this;  // found leaf node which contains p
    } else return false; 
  }

  /** Check if edge is legal. */
  isIllegal(edge, coordList) {
    const triangle = new Triangle(edge.u, this.triangle.getOppositeVertex(edge), edge.v);
    const adjTriangleNode = this.getAdjacentTriangleNode(edge);
    if (adjTriangleNode == null) return false; // not illegal if no adjacent triangle node present (bounding triangle)
    const v4 = adjTriangleNode.triangle.getOppositeVertex(edge);

    const storedCCW = triangle.isStoredCounterClockWise(coordList)
    return triangle.circumCircleContains(v4, coordList, storedCCW);
  }
}

/**
 * Get all triangles from the search structure.
 * 
 * Use getTrianglesAdjacent
 */
function getTriangles(node, traversedNodes = []) {
  console.log('You used getTriangles, use getTrianglesAdjacent instead.')
  // prune already traversed nodes
  if (traversedNodes.includes(node)) return [];
  traversedNodes.push(node)

  if (node.deleted) {
    let triangles = [];
    for (let i = 0; i < node.descendants.length; i++) {
      const child = node.descendants[i];
      triangles.push(...getTriangles(child, traversedNodes));
    }
    return triangles;
  } else {
    return [node.triangle];
  }
}

/**
 * Returns all leaves of search tree.
 * @param {TriangleSearchTreeNode} root 
 * @returns array of triangle instances
 */
function getTrianglesAdjacent(root){
  const triangles = [];
  let node = root;
  while (node.deleted){
    node = node.descendants[0];
  }

  const seenNodes = [];
  seenNodes.push(node);

  const stack = [node];
  while (stack.length > 0){
    const current = stack.pop();
    if (!current.containing){
      const triangle = current.triangle;
      triangle.searchNode = current;
      triangles.push(triangle);
    }

    for (let i = 0; i < current.adjacentTriangleNodes.length; i++){
      const adj = current.adjacentTriangleNodes[i];
      if (adj.deleted){
        throw "Error: should never be here.";
      }
      if (seenNodes.includes(adj)){
        continue;
      }
      stack.push(adj);
      seenNodes.push(adj);
    }
  }
  return triangles;
}

/**
 * Returns edges to draw Delaunay triangulation.
 * @param {Array<Coordinate>} P
 * 
 * Implementation: Tristan
 */
function getDelaunayTriangulationIncremental(P) {
  const boundingTriangleCoords = getBoundingTriangle(P);
  const [topLeftCoordinate, topRightCoordinate, bottomCoordinate] = boundingTriangleCoords;
  const coordList = P.concat(boundingTriangleCoords);

  // get large triangle edges in coordinates (so not Edge object)
  largeTriangleEdges = [
    [topLeftCoordinate, topRightCoordinate], 
    [topRightCoordinate, bottomCoordinate], 
    [bottomCoordinate, topLeftCoordinate]
  ];

  const containingTriangle = [P.length, P.length+1, P.length+2]

  // start incremental construction
  // create search structure
  const S = new TriangleSearchTreeNode(new Triangle(...containingTriangle));
  S.containing = true;

  for (let i = 0; i < P.length; i++) {
    // INSERT(i, S)
    const enclosingTriangle = S.getTriangleNodeContaining(coordList[i], coordList);
    if (enclosingTriangle){
      enclosingTriangle.split(i, coordList);
    } else {
      throw 'Error: point does not lie in bounding triangle.';
    }
  }

  let triangles = getTrianglesAdjacent(S);
  return [triangles, coordList, S];
}
