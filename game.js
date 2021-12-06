const canvas = document.getElementById("pixi-canvas");
const ctx = canvas.getContext('2d');

class Coordinate {
  constructor(x, y) {
    this.x = x;
    this.y = y;
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
  return [[0,1]];
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

/**
 * Returns alpha-shape edges
 * @param {Array<Coordinate>} P - input set
 * @param {Number} alpha
 * 
 * Implementation: Steven
 */
function getAlphaShape(P, alpha) {
  return [[0,1]];
}

/**
 * Draws art to canvas.
 * 
 * Implementation: Martijn
 */
function drawArt() {

}

function drawStuff(img) {
  // Make an offscreen canvas to render the image on
  const imgCanvas = document.createElement("canvas");
  const imgCtx = imgCanvas.getContext("2d");
  const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
  console.log(scale);
  const w = Math.floor(img.width * scale);
  const h = Math.floor(img.height * scale);
  imgCanvas.width = w;
  imgCanvas.height = h;
  // Draw the image on the canvas
  imgCtx.drawImage(img, 0, 0, w, h);
  // Get pixel data of canvas, and thus of the image
  const imgData = imgCtx.getImageData(0, 0, w, h).data;
  
  // Go through the pixels, making jumps of 5, sample the colors and draw circles.
  const off = 5;
  const r = 2;
  for (let x = 0; x < w; x += off){
    for (let y = 0; y < h; y += off){
      const index = x + y * w;
      ctx.fillStyle = `rgba(${imgData[4*index]}, ${imgData[4*index+1]}, ${imgData[4*index+2]}, ${imgData[4*index+3]})`;
      ctx.beginPath();
      ctx.arc(x + r, y + r, r, 0, 2*Math.PI);
      ctx.fill();
    }
  }
}
