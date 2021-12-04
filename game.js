const canvas = document.getElementById("pixi-canvas");
const ctx = canvas.getContext('2d');

function handleImageFile(file){
  const reader = new FileReader();
  const img = new Image();
  reader.onload = (event) => {
    img.src = event.target.result;
    img.onload = function() {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
  }
  reader.readAsDataURL(file);
}

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
function insert(p, T)

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

const app = new PIXI.Application({ antialias: true, view: canvas, transparent: true });

const graphics = new PIXI.Graphics();

// Circle
graphics.lineStyle(0); // draw a circle, set the lineStyle to zero so the circle doesn't have an outline
graphics.beginFill(0xDE3249, 1);
graphics.drawCircle(100, 250, 10);
graphics.endFill();

// Circle + line style 1
graphics.lineStyle(2, 0xFEEB77, 1);
graphics.beginFill(0x650A5A, 1);
graphics.drawCircle(250, 250, 50);
graphics.endFill();

// Circle + line style 2
graphics.lineStyle(10, 0xFFBD01, 1);
graphics.beginFill(0xC34288, 1);
graphics.drawCircle(400, 250, 50);
graphics.endFill();

app.stage.addChild(graphics);
