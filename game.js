const canvas = document.getElementById("pixi-canvas");
const ctx = canvas.getContext('2d');
let image = undefined
const gui = new dat.GUI({name: 'Artstract GUI'});
const options = {
  alpha: 15.0
}
const alphaController = gui.add(options, 'alpha');
alphaController.onChange(() => drawStuff());

const r = 2;

class Coordinate {
  constructor(x, y) {
    this.x = x;
    this.y = y;
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
 * 
 * Implementation: Tristan
 */
function getDelaunayTriangulation(P){
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
function getAlphaShape(del, coords, alpha) {
  const triangles = del.triangles;
  const allEdges = [];
  const perimeterEdges = [];

  for (let i = 0; i < triangles.length; i+=3) {
    const t0 = triangles[i];
    const t1 = triangles[i+1];
    const t2 = triangles[i+2];
    const p1 = coords[t0];
    const p2 = coords[t1];
    const p3 = coords[t2];
    const r = circumradius(p1, p2, p3);
    if (r < alpha) { 
      const edges = [[t0, t1], [t1, t2], [t2, t0]];
      for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        const flippedEdge = edge.reverse();
        if (!allEdges.some(e => (e[0] == edge[0] && e[1] == edge[1]) || (e[0] == flippedEdge[0] && e[1] == flippedEdge[1]))){
          allEdges.push(edge);
          perimeterEdges.push(edge);
        } else {
          console.log(":)")
          perimeterEdges = perimeterEdges.filter(e => !(e[0] == edge[0] && e[1] == edge[1]) && !(e[0] == flippedEdge[0] && e[1] == flippedEdge[1]));
        }
      }
    }
  }
  
  return perimeterEdges;
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

  const fewerPoints = points.filter(p => Math.random() < 0.1);

  // Draw points
  drawPoints(fewerPoints);

  const coordList = fewerPoints.map(p => p.pos);
  const del = getDelaunayTriangulation(coordList);

  // Draw triangulation
  // for (let i = 0; i < del.triangles.length; i += 3) {
  //   ctx.beginPath();
  //   ctx.moveTo(coordList[del.triangles[i]].x, coordList[del.triangles[i]].y);
  //   ctx.lineTo(coordList[del.triangles[i+1]].x, coordList[del.triangles[i+1]].y);
  //   ctx.lineTo(coordList[del.triangles[i+2]].x, coordList[del.triangles[i+2]].y);
  //   ctx.stroke();
  // }


  const perimeterEdges = getAlphaShape(del, coordList, options.alpha);
  // Draw alpha shape
  perimeterEdges.forEach(edge => {
    ctx.beginPath();
    ctx.moveTo(coordList[edge[0]].x, coordList[edge[0]].y);
    ctx.lineTo(coordList[edge[1]].x, coordList[edge[1]].y);
    ctx.stroke();
  })
}
