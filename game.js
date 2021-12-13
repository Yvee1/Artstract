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

function sign(p1, p2, p3) {
  (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
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
