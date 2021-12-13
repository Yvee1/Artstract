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
  }

  split(p) {
    const t1 = new TriangleSearchTreeNode([p, this.triangle[0], this.triangle[1]]);
    const t2 = new TriangleSearchTreeNode([p, this.triangle[0], this.triangle[2]]);
    const t3 = new TriangleSearchTreeNode([p, this.triangle[1], this.triangle[2]]);
    this.descendants = [t1, t2, t3];
    this.deleted = true;
  }

  /* Returns triangle which contains the point p */
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
}

/**
 * Get all triangles from the search structure.
 */
function getTriangles(S) {
  triangles = [];
  S.descendants.forEach(node => {
    if (node.deleted) {
      triangles.concat(getTriangles(node));
    } else {
      triangles.push(node.triangle);
    }
  });
  return triangles;
}

function getTriangleEdges(triangle) {
  const e1 = [triangle[0], triangle[1]];
  const e2 = [triangle[0], triangle[2]];
  const e3 = [triangle[1], triangle[2]];
  return [e1, e2, e3];
}

function drawTriangles(triangles, coordList) {
  triangles.forEach(triangle => {
    drawTriangle(triangle, coordList)
  })

}

function drawTriangle(triangle, coordList) {
  getTriangleEdges(triangle).forEach(edge => {
    drawEdge(edge, coordList)
  })
}

function drawEdge(edge, coordList) {
  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.moveTo(coordList[edge[0]].x, coordList[edge[0]].y);
  ctx.lineTo(coordList[edge[1]].x, coordList[edge[1]].y);
  ctx.stroke();
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
  let S = new TriangleSearchTreeNode([P.length, P.length+1, P.length+2])

  for (let i = 0; i < P.length; i++) {
    if (!coordList[i].isInTriangle(S.triangle, coordList)) {
      console.log(coordList[i]);
      console.log('is not in');
      console.log(coordList[S.triangle[0]]);
      console.log(coordList[S.triangle[1]]);
      console.log(coordList[S.triangle[2]]);
    }
  }

  for (let i = 0; i < P.length; i++) {
    const enclosingTriangle = S.getTriangleNodeContaining(i, coordList);
    enclosingTriangle.split(i);
  }

  triangles = getTriangles(S);
  drawTriangles(triangles, coordList);

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
