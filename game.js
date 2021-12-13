const canvas = document.getElementById("pixi-canvas");
const ctx = canvas.getContext('2d');
let image = undefined
let points = undefined
const gui = new dat.GUI({name: 'Artstract GUI'});
const options = {
  alpha: 15.0,
  debug: false,
}
const alphaController = gui.add(options, 'alpha');
alphaController.onChange(() => drawStuff());

const debugController = gui.add(options, 'debug');
debugController.onChange(() => drawStuff());
const r = 3;

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

function computePointsFromImage() {
  // Make an offscreen canvas to render the image on
  const imgCanvas = document.createElement("canvas");
  const imgCtx = imgCanvas.getContext("2d");
  const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
  // console.log(scale);
  const w = Math.floor(image.width * scale);
  const h = Math.floor(image.height * scale);
  imgCanvas.width = w;
  imgCanvas.height = h;
  // Draw the image on the canvas
  imgCtx.drawImage(image, 0, 0, w, h);
  // Get pixel data of canvas, and thus of the image
  const imgData = imgCtx.getImageData(0, 0, w, h).data;

  // Go through the pixels, making jumps of 5, sample the colors and draw circles.
  const off = 5;
  points = new Array(Math.ceil(w/off) * Math.ceil(h/off));
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
}

function drawStuff() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const fewerPoints = points.filter(p => Math.random() < 0.1);

  // Draw points
  // drawPoints(fewerPoints);

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

  const alphaShape = getAlphaShape(del, coordList, options.alpha);
  const perimeterEdges = alphaShape[1];
  const alphaTriangles = alphaShape[0];

  alphaTriangles.forEach(polygon => {
    const firstPoint = fewerPoints[polygon[0]];
    ctx.lineWidth = 1;
    ctx.fillStyle = `rgb(${firstPoint.color.r}, ${firstPoint.color.g}, ${firstPoint.color.b}, 1.0)`;
    ctx.strokeStyle = `rgb(${firstPoint.color.r}, ${firstPoint.color.g}, ${firstPoint.color.b}, 1.0)`;
    ctx.beginPath();
    ctx.moveTo(coordList[polygon[0]].x, coordList[polygon[0]].y);
    for (let i = 1; i < polygon.length+1; i++){
      ctx.lineTo(coordList[polygon[i%polygon.length]].x, coordList[polygon[i%polygon.length]].y);
    }
    ctx.fill();
    ctx.stroke();
  })

  // Draw perimeter edges of alpha shape
  perimeterEdges.forEach(edge => {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(coordList[edge[0]].x, coordList[edge[0]].y);
    ctx.lineTo(coordList[edge[1]].x, coordList[edge[1]].y);
    ctx.stroke();
    // ctx.fillStyle = 'black';
    // ctx.font = "10px Arial";
    // ctx.fillText(edge[0], coordList[edge[0]].x, coordList[edge[0]].y); 
    // ctx.fillText(edge[1], coordList[edge[1]].x, coordList[edge[1]].y); 
  })
}
