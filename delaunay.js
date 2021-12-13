/**
 * Returns edges to draw Delaunay triangulation.
 * @param {Array<Coordinate>} P
 */
function getDelaunayTriangulation(P){
  const coords = P.flatMap(c => [c.x, c.y]);
  const delaunay = new Delaunator(coords);
  return delaunay;
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

/* Randomize array in-place using Durstenfeld shuffle algorithm */
function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
  }
}

/**Class for search structure in Delaunay triangulation. */
class TriangleSearchTreeNode {
  constructor(triangle) {
    this.triangle = triangle;
    this.deleted = false;
  }

  split(p) {
    const t1 = new TriangleSearchTreeNode([p, this.triangle[0], this.triangle[1]]);
    const t2 = new TriangleSearchTreeNode([p, this.triangle[0], this.triangle[2]]);
    const t3 = new TriangleSearchTreeNode([p, this.triangle[1], this.triangle[2]]);
    this.descendants = [t1, t2, t3];
    this.deleted = true;
  }

  /* Returns triangle which constains the point p */
  getTriangleContaining(p, coordList) {
    if (this.deleted) { // recurse through descendants
      this.descendants.forEach(node => {
        const triangle = node.searchTriangleContaining(p, coordList);
        if (triangle) return triangle;
      });
      throw "Should not be here."; // should always have at least one triangle containing the point unless not started at root node
    } else { // return triangle if found, otherwise false
      return p.isInTriangle(this.triangle, coordList) ? this.triangle : false;
    }
  }
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
  const coordList = P.concat(P, boundingTriangleCoords);

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
  let S = TriangleSearchTreeNode([P.size, P.size+1, P.size+2])
  for (let i = 0; i < P.size; i++) {
    const enclosingTriangle = S.searchTriangleContaining(i, coordList)
    // continue
  }

  // start Delaunay

  const coords = P.flatMap(c => [c.x, c.y]);
  const delaunay = new Delaunator(coords);
  return delaunay;
}

/**
 * 
 * @param {Coordinate} p 
 * @param {Array<Coordinate>} T 
 */
function insert(p, T) {
  return;
}

/**
 * Legalizes edge (pi, pj) if illegal.
 * @param {Coordinate} pr 
 * @param {Coordinate} pi 
 * @param {Coordinate} pj 
 * @param {Array<Coordinate>} T 
 * 
 * Implementation: Tristan
 */
function legalizeEdge(pr, pi, pj, T) {
  return T;
}
