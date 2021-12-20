/**
 * Returns edges to draw Delaunay triangulation.
 * @param {Array<Coordinate>} P
 */
function getDelaunayTriangulation(P){
  const coords = P.flatMap(c => [c.x, c.y]);
  const delaunay = new Delaunator(coords);
  return delaunay;
}

function sign(p1, p2, p3) {
  return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
}


/**TODO: code from SO */
function isStoredCounterClockWise(v1, v2, v3, coordList) {
  const a = coordList[v1];
  const b = coordList[v2];
  const c = coordList[v3];
  return (b.x - a.x)*(c.y - a.y)-(c.x - a.x)*(b.y - a.y) > 0;
}

/**TODO: code from SO */
function circumCircleContains(v1, v2, v3, p, coordList) {
  const a = coordList[v1];
  const b = coordList[v2];
  const c = coordList[v3];
  const d = coordList[p];
  let ax_ = a.x-d.x;
  let ay_ = a.y-d.y;
  let bx_ = b.x-d.x;
  let by_ = b.y-d.y;
  let cx_ = c.x-d.x;
  let cy_ = c.y-d.y;
  return (
      (ax_*ax_ + ay_*ay_) * (bx_*cy_-cx_*by_) -
      (bx_*bx_ + by_*by_) * (ax_*cy_-cx_*ay_) +
      (cx_*cx_ + cy_*cy_) * (ax_*by_-bx_*ay_)
  ) > 0;
}

function drawTriangles(triangles, coordList) {
  triangles.forEach(triangle => {
    triangle.draw(coordList);
  })
}

/**
 * Returns Coordinates of triangle around the input point set.
 */
 function getBoundingTriangle(P) {
  // Create triangle around P
  let minX = Number.MAX_VALUE
  let maxX = Number.MIN_VALUE
  let minY = Number.MAX_VALUE
  let maxY = Number.MIN_VALUE

  P.forEach(p => {
    minX = Math.min(p.x, minX)
    maxX = Math.max(p.x, maxX)
    minY = Math.min(p.y, minY)
    maxY = Math.max(p.y, maxY)
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
  const bottomCoordinate = new Coordinate((minX + maxX)/2, (width/2+height)/Math.tan(Math.PI/4))

  return [topLeftCoordinate, topRightCoordinate, bottomCoordinate];
}

/**
 * Randomize array in-place using Durstenfeld shuffle algorithm
 *  
 * TODO: reference since copied from SO
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
    this.deleted = false;

    this.adjacentTriangleNodes = [];
  }

  split(p, coordList) {
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

    return [t1, t2, t3, e1, e2, e3, p];
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
    if (coordList[p].isInTriangle(this.triangle, coordList)) {
      if (this.deleted) { // recurse through descendants
        for (let i = 0; i < this.descendants.length; i++) {
          const node = this.descendants[i];
          const triangleNode = node.getTriangleNodeContaining(p, coordList);
          if (triangleNode != false) {
            return triangleNode;
          }
        }
        throw "Should not be here."; // should always have at least one triangle containing the point unless not started at root node
      } else return this;  // found leaf node which contains p
    } else return false; 
  }

  /** Check if edge is legal. */
  isIllegal(edge, coordList) {
    const v1 = edge.u;
    const v2 = this.triangle.getOppositeVertex(edge);
    const v3 = edge.v;

    const adjTriangleNode = this.getAdjacentTriangleNode(edge);
    if (adjTriangleNode == null) return false;

    const v4 = adjTriangleNode.triangle.getOppositeVertex(edge);

    if (isStoredCounterClockWise(v1, v2, v3, coordList)) {
      return (circumCircleContains(v1, v2, v3, v4, coordList));
    } else {
      return (circumCircleContains(v3, v2, v1, v4, coordList));
    }
  }
}

/**
 * Get all triangles from the search structure.
 */
function getTriangles(S, triangles = []) {
  if (S.deleted) {
    S.descendants.forEach(node => {
      triangles.concat(getTriangles(node, triangles));
    });
  } else {
    triangles.push(S.triangle);
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
  shuffleArray(P); // shuffle in place
  const boundingTriangleCoords = getBoundingTriangle(P);
  const [topLeftCoordinate, topRightCoordinate, bottomCoordinate] = boundingTriangleCoords;
  const coordList = P.concat(boundingTriangleCoords);

  // get large triangle edges in coordinates (so not Edge object)
  largeTriangleEdges = [
    [topLeftCoordinate, topRightCoordinate], 
    [topRightCoordinate, bottomCoordinate], 
    [bottomCoordinate, topLeftCoordinate]
  ];

  // draw bounding triangle
  largeTriangleEdges.forEach(edge => {
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(edge[0].x, edge[0].y);
    ctx.lineTo(edge[1].x, edge[1].y);
    ctx.stroke();
  })

  // start incremental construction
  // create search structure
  let S = new TriangleSearchTreeNode(new Triangle(P.length, P.length+1, P.length+2))

  for (let i = 0; i < P.length; i++) {
    // INSERT(i, S)
    const enclosingTriangle = S.getTriangleNodeContaining(i, coordList);
    const desc = enclosingTriangle.split(i, coordList);

    const t1 = desc[0];
    const t2 = desc[1];
    const t3 = desc[2];
    const e1 = desc[3];
    const e2 = desc[4];
    const e3 = desc[5];
    const p = desc[6];

    // check for needed flips
    t1.legalize(e1, p, coordList);
    t2.legalize(e2, p, coordList);
    t3.legalize(e3, p, coordList);
    
    console.log(i);
  }

  let triangles = getTriangles(S);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTriangles(triangles, coordList);

  // start Delaunay

  const coords = P.flatMap(c => [c.x, c.y]);
  const delaunay = new Delaunator(coords);
  return delaunay;
}
