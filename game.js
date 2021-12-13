const canvas = document.getElementById("pixi-canvas");
const ctx = canvas.getContext('2d');
let image = undefined
const gui = new dat.GUI({name: 'Artstract GUI'});
const options = {
  alpha: 15.0,
  debug: true,
}
const alphaController = gui.add(options, 'alpha');
alphaController.onChange(() => drawStuff());

const debugController = gui.add(options, 'debug');
debugController.onChange(() => drawStuff());
const r = 3;

function sign(p1, p2, p3) {
  (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
}

class Coordinate {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  /* Returns whether this coordinate lies in the triangle */
  isInTriangle(triangle, coordList) {
    p1 = coordList[triangle[0]];
    p2 = coordList[triangle[1]];
    p3 = coordList[triangle[2]];

    const d1 = sign(this, p1, p2);
    const d2 = sign(this, p2, p3);
    const d3 = sign(this, p1, p3);

    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
    return !(hasNeg && hasPos);
  }
}


class Point {
  constructor(pos, color) {
    this.pos = pos;
    this.color = color;
  }
}

class RGB {
  constructor(r, g, b){
    this.r = r;
    this.g = g;
    this.b = b;
  }
}

/**
 * Returns array of k colors present in image.
 * @param {Element} image 
 * @param {Number} k
 * @return {Array} colors
 * 
 * Implementation: Martijn
 */
function getColorPalette(image, k) {
  return [[0,0,0]];
}

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
    if (p.isInTriangle(this.triangle, coordList)) {
      if (this.deleted) { // recurse through descendants
        this.descendants.forEach(node => {
          const triangle = node.getTriangleContaining(p, coordList);
          if (triangle) return triangle;
        });
        throw "Should not be here."; // should always have at least one triangle containing the point unless not started at root node
      } else return true;  // found leaf node which contains p
    } else return false; 
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

function circumradius(p1, p2, p3) {
  const a = Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2);
  const b = Math.sqrt((p3.x - p2.x)**2 + (p3.y - p2.y)**2);
  const c = Math.sqrt((p1.x - p3.x)**2 + (p1.y - p3.y)**2);

  return (a * b * c) / Math.sqrt((a + b + c) * (b + c - a) * (c + a - b) * (a + b - c));
}

/**
 * Returns alpha-shape edges
 * @param {Array<Coordinate>} del - input set
 * @param {Number} alpha
 * 
 * Implementation: Steven
 */
function getAlphaShape(del, coords, alpha){

}

function getAlphaShapePerimeterEdges(del, coords, alpha) {
  // Assumption: for every triangle the vertices are in counter-clockwise order.

  // Shorthand
  const triangles = del.triangles;

  // We will filter the triangles based on alpha, and determine the perimeter edges of the resulting triangulation(s).
  const allEdges = [];
  let perimeterEdges = [];

  for (let i = 0; i < triangles.length; i+=3) {
    // Indices of the triangle vertices
    const t0 = triangles[i];
    const t1 = triangles[i+1];
    const t2 = triangles[i+2];
    // Coordinates of the triangle vertices
    const p1 = coords[t0];
    const p2 = coords[t1];
    const p3 = coords[t2];
    // Calculate circumradius; should be < alpha to be in the alpha shape.
    const r = circumradius(p1, p2, p3);
    if (r < alpha) { 
      // These are the edges of the triangle, we'll determine which are perimeter edges.
      const edges = [[t0, t1], [t1, t2], [t2, t0]];
      for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        const flippedEdge = edge.slice().reverse();
        // If this is the first time we encounter this edge (regardless of direction) it is a candidate perimeter edge.
        if (!allEdges.some(e => (e[0] == edge[0] && e[1] == edge[1]) || (e[0] == flippedEdge[0] && e[1] == flippedEdge[1]))){
          allEdges.push(edge);
          perimeterEdges.push(edge);
        } else { 
          // An edge is a perimeter edge iff we encounter it exactly once. 
          //So if we have encoutnered the edge before, it is no longer a candidate perimeter edge, therefore remove it.
          perimeterEdges = perimeterEdges.filter(e => !(e[0] == edge[0] && e[1] == edge[1]) && !(e[0] == flippedEdge[0] && e[1] == flippedEdge[1]));
        }
      }
    }
  }
  
  return perimeterEdges;
}

function ccwAngle(p1, p2, p3){
  // Angle of below would be approx. 5/4*pi
  //                p3
  //              /
  //            /
  // p1 ----- p2
  const x1 = p2.x - p1.x;
  const y1 = p2.y - p1.y;
  const x2 = p3.x - p2.x;
  const y2 = p3.y - p2.y;
  const dot = x1 * x2 + y1 * y2;
  const det = x1 * y2 - y1 * x2;
  return Math.atan2(dot, det);
}

function perimeterEdgesToPolygons(edges){
  // We first create a mapping from the edges. If vertex u has outgoing edges (u, v) and (u, w) then u is mapped to [v, w].
  const mapping = new Map();
  const polygons = [];
  const remainingVertices = new Set();

  for (let i = 0; i < edges.length; i++){
    if (mapping.has(edges[i][0])){
      mapping.get(edges[i][0]).push(edges[i][1]);
    } else {
      mapping.set(edges[i][0], [edges[i][1]]);
    }
    remainingVertices.add(edges[i][0]);
  }

  while(remainingVertices.size > 0){
    const polygon = [];
    // Get a vertex from the set
    const start = remainingVertices.values().next().value;
    polygon.push(start);
    let current = start;
    let prev = -1;
    for (let i = 0; i < edges.length; i++){ // while(true) but just to prevent it going into an infinite loop in case of a mistake
      // Which vertices can be reached from current?
      const possibleNexts = mapping.get(current);
      // Get the one with the smallest angle; this is the one in the same polygon.
      const next = prev < 0 ? possibleNexts[0] : possibleNexts.reduce((acc, x) => ccwAngle(prev, current, x) < ccwAngle(prev, current, acc) ? x : acc);
      // Remove it from the list
      possibleNexts.splice(possibleNexts.indexOf(next), 1);

      polygon.push(next);
      remainingVertices.delete(current);
      prev = current;
      current = next;
      // If we found a closed polygon we stop going around.
      if (current == start){
        break;
      }
    }
    polygons.push(polygon);
  }
  return polygons;
}

function pointInsidePolygon(point, poly){
  // TODO
}

function polygonsToNestedPolygons(polygons){
  const nestedPolygons = [];
  const inner = new Set();
  for (let i = 0; i < polygons.length; i++){
    if (inner.has(i)){
      continue;
    }
    const p1 = polygons[i];
    nestedPolygons.push([p1]);
    for (let j = 0; i < polygons.length; j++){
      if (i == j){
        continue;
      }
      const p2 = polygons[j];
      if (p2.some(point => !pointInsidePolygon(point, p1))){
        continue;
      }
      // Now: p2 nested in p1
      inner.add(j);
      nestedPolygons[nestedPolygons.length - 1].push(p2);
    }
  }
  return nestedPolygons;
}

/**
 * Draws art to canvas.
 * 
 * Implementation: Martijn
 */
function drawArt() {

}

function drawPoints(points){
  for (let i = 0; i < points.length; i++){
    const point = points[i];
    ctx.fillStyle = `rgb(${point.color.r}, ${point.color.g}, ${point.color.b})`;
    ctx.beginPath();
    ctx.arc(point.pos.x, point.pos.y, r, 0, 2*Math.PI);
    ctx.fill();
  }
}

function drawStuff() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Make an offscreen canvas to render the image on
  const imgCanvas = document.createElement("canvas");
  const imgCtx = imgCanvas.getContext("2d");
  const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
  console.log(scale);
  const w = Math.floor(image.width * scale);
  const h = Math.floor(image.height * scale);
  imgCanvas.width = w;
  imgCanvas.height = h;
  // Draw the image on the canvas
  imgCtx.drawImage(image, 0, 0, w, h);
  // Get pixel data of canvas, and thus of the image
  const imgData = imgCtx.getImageData(0, 0, w, h).data;

  // Go through the pixels, making jumps of 5, sample the colors and draw circles.
  const off = 15;
  const points = new Array(Math.ceil(w/off) * Math.ceil(h/off));
  let i = 0;

  for (let x = 0; x < w; x += off){
    for (let y = 0; y < h; y += off){
      const index = x + y * w;
      const pos = new Coordinate(x + r, y + r);
      const color = new RGB(imgData[4*index], imgData[4*index+1], imgData[4*index+2]);
      points[i] = new Point(pos, color);
      i++;
    }
  }

  const fewerPoints = points.filter(p => Math.random() < 0.05);

  // Draw points
  drawPoints(fewerPoints);

  const coordList = fewerPoints.map(p => p.pos);
  const del = options.debug ? getDelaunayTriangulationIncremental(coordList) : getDelaunayTriangulation(coordList);

  // Draw triangulation
  // for (let i = 0; i < del.triangles.length; i += 3) {
  //   ctx.beginPath();
  //   ctx.moveTo(coordList[del.triangles[i]].x, coordList[del.triangles[i]].y);
  //   ctx.lineTo(coordList[del.triangles[i+1]].x, coordList[del.triangles[i+1]].y);
  //   ctx.lineTo(coordList[del.triangles[i+2]].x, coordList[del.triangles[i+2]].y);
  //   ctx.stroke();
  // }

  const perimeterEdges = getAlphaShapePerimeterEdges(del, coordList, options.alpha);
  const polygons = perimeterEdgesToPolygons(perimeterEdges);

  // Draw perimeter edges of alpha shape
  perimeterEdges.forEach(edge => {
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(coordList[edge[0]].x, coordList[edge[0]].y);
    ctx.lineTo(coordList[edge[1]].x, coordList[edge[1]].y);
    ctx.stroke();
    ctx.font = "10px Arial";
    ctx.fillText(edge[0], coordList[edge[0]].x, coordList[edge[0]].y); 
    ctx.fillText(edge[1], coordList[edge[1]].x, coordList[edge[1]].y); 
  })

  polygons.forEach(polygon => {
    const firstPoint = fewerPoints[polygon[0]];
    ctx.fillStyle = `rgb(${firstPoint.color.r}, ${firstPoint.color.g}, ${firstPoint.color.b}, 0.5)`;
    ctx.beginPath();
    ctx.moveTo(coordList[polygon[0]].x, coordList[polygon[0]].y);
    for (let i = 1; i < polygon.length; i++){
      ctx.lineTo(coordList[polygon[i]].x, coordList[polygon[i]].y);
    }
    ctx.fill();
  })

  console.log("Polygons");
  console.log(polygons);
  // const nestedPolygons = polygonsToNestedPolygons(polygons);
  // console.log("Nested polygons");
  // console.log(nestedPolygons);
}
