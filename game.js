const canvas = document.getElementById("pixi-canvas");
const ctx = canvas.getContext('2d');

let image, w, h, xoff, yoff, points, fewerPoints, groupedPoints = undefined
const gui = new dat.GUI({name: 'Artstract GUI'});
const options = {
  alpha: 60.0,
  debug: true,
  offset: 10.0,
  dropout: 0.6,
  k: 16,
  showPoints: false,
  showPolygons: true,
  showTriangles: false,
  showImage: true,
}
const offsetController = gui.add(options, 'offset', 5, 20, 1);
offsetController.onChange(() => { computePointsFromImage(); drawArt() });

const dropoutController = gui.add(options, 'dropout', 0.0, 1.0);
dropoutController.onChange(() => { computePointsFromImage(); drawArt() });

const kController = gui.add(options, 'k', 1, 128, 1)
kController.name("#colors (2^k)")
kController.onChange(() => { computePointsFromImage(); drawArt() });

const alphaController = gui.add(options, 'alpha', 1, 200);
alphaController.onChange(() => drawArt());

const debugController = gui.add(options, 'debug');
debugController.name("use our Delaunay")
debugController.onChange(() => drawArt());

const showPointsController = gui.add(options, 'showPoints')
showPointsController.onChange(() => { drawArt() });

const showPolygonsController = gui.add(options, 'showPolygons')
showPolygonsController.onChange(() => { drawArt() });

const showTrianglesController = gui.add(options, 'showTriangles')
showTrianglesController.onChange(() => { drawArt() });

const showImageController = gui.add(options, 'showImage')
showImageController.onChange(() => { drawArt() });

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
  w = Math.floor(image.width * scale);
  h = Math.floor(image.height * scale);
  imgCanvas.width = w;
  imgCanvas.height = h;
  // Draw the image on the canvas
  xoff = (canvas.width-w)/2;
  yoff = (canvas.height-h)/2
  imgCtx.drawImage(image, 0, 0, w, h);
  // Get pixel data of canvas, and thus of the image
  const imgData = imgCtx.getImageData(0, 0, w, h).data;

  // Go through the pixels, making jumps of 5, sample the colors and draw circles.
  const off = options.offset;
  points = new Array(Math.ceil(w/off) * Math.ceil(h/off));
  let i = 0;

  for (let x = 0; x < w; x += off){
    for (let y = 0; y < h; y += off){
      const index = x + y * w;
      const pos = new Coordinate(xoff + x + r, yoff + y + r);
      const color = new RGB(imgData[4*index], imgData[4*index+1], imgData[4*index+2]);
      points[i] = new Point(pos, color);
      i++;
    }
  }
  shuffleArray(points);

  fewerPoints = points.filter(p => Math.random() > options.dropout);
  groupedPoints = quantize(fewerPoints, options.k);
}

function imageDataFromPoints(points){
  const imgData = [];
  for (let i = 0; i < points.length; i++){
    imgData.push(points[i].color.r, points[i].color.g, points[i].color.b, 1.0);
  }
  return imgData;
}

function drawArt() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (options.showImage){
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.drawImage(image, xoff, yoff, w, h);
    ctx.restore();
  }

  // console.log(output);

  groupedPoints.map ((pts, index) => {
    const color = output[index];
    let coordList = pts.map(p => p.pos);

    // Compute Delaunay triangulation
    let del;
    if (options.debug) {
      const output = getDelaunayTriangulationIncremental(coordList);
      del = output[0];
      coordList = output[1];
    } else {
      del = getDelaunayTriangulation(coordList);
    }

    if (options.showTriangles){
      for (let i = 0; i < del.length; i+=3){
        ctx.lineWidth = 1;
        ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]}, 1.0)`;
        // ctx.strokeStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]}, 1.0)`;
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.moveTo(coordList[del[i]].x, coordList[del[i]].y);
        for (let j = 1; j < 4; j++){
          ctx.lineTo(coordList[del[i + (j%3)]].x, coordList[del[i + (j%3)]].y);
        }
        ctx.fill();
        ctx.stroke();
      }
    }

    if (options.showPolygons){
      // Compute Alpha shape
      const alphaShape = getAlphaShape(del, coordList, options.alpha);
      const perimeterEdges = alphaShape[1];
      const alphaTriangles = alphaShape[0];

      // Draw inside of alpha shapes
      alphaTriangles.forEach(polygon => {
        ctx.lineWidth = 1;
        ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]}, 1.0)`;
        ctx.strokeStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]}, 1.0)`;
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
  })

  // Draw points
  if (options.showPoints){
    drawPoints(fewerPoints);
  }
}
