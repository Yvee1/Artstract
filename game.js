const canvas = document.getElementById("pixi-canvas");
const ctx = canvas.getContext('2d');
let startScreen = true;
let image, w, h, xoff, yoff, points, fewerPoints, groupedPoints = undefined
let gui, options;

const r = 3;

function createGUI(){
  gui = new dat.GUI({name: 'Artstract GUI'});
  options = {
    alpha: 60.0,
    offset: 10.0,
    dropout: 0.6,
    k: 16,
    showPoints: false,
    showPolygons: true,
    showTriangles: false,
    showImage: true,
    debug: true,
    showOutline: true,
  }
  offsetController = gui.add(options, 'offset', 5, 20, 1);
  offsetController.onChange(() => { computePointsFromImage(); drawArt() });

  dropoutController = gui.add(options, 'dropout', 0.0, 1.0);
  dropoutController.onChange(() => { computePointsFromImage(); drawArt() });

  kController = gui.add(options, 'k', 1, 128, 1)
  kController.name("#colors (2^k)")
  kController.onChange(() => { computePointsFromImage(); drawArt() });

  alphaController = gui.add(options, 'alpha', 1, 200);
  alphaController.onChange(() => drawArt());

  showImageController = gui.add(options, 'showImage')
  showImageController.onChange(() => { drawArt() });

  gui.add(options, 'showOutline').onChange(() => { drawArt() });

  debugFolder = gui.addFolder('Debug folder');

  debugController = debugFolder.add(options, 'debug');
  debugController.name("use our Delaunay")
  debugController.onChange(() => drawArt());

  showPointsController = debugFolder.add(options, 'showPoints')
  showPointsController.onChange(() => { drawArt() });

  showPolygonsController = debugFolder.add(options, 'showPolygons')
  showPolygonsController.onChange(() => { drawArt() });

  showTrianglesController = debugFolder.add(options, 'showTriangles')
  showTrianglesController.onChange(() => { drawArt() });
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
  ctx.setLineDash([]);
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
      const polygons = perimeterEdgesToPolygons(perimeterEdges);
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

      // Draw outline of alpha shapes
      if (options.showOutline){
        polygons.forEach(polygon => {
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'black';
          ctx.beginPath();
          ctx.moveTo(coordList[polygon[0]].x, coordList[polygon[0]].y);
          for (let i = 1; i < polygon.length+1; i++){
            ctx.lineTo(coordList[polygon[i%polygon.length]].x, coordList[polygon[i%polygon.length]].y);
          }
          ctx.stroke();
        })
      }
    }
  })

  // Draw points
  if (options.showPoints){
    drawPoints(fewerPoints);
  }
}

class Line {
  constructor(x){
    // Start and end x-positions of the line
    this.sx = x + (Math.random()-0.5)*20.0;
    this.ex = x + 150.0 + (Math.random()-0.5)*20.0;
    
    this.c1x = x+65 + (Math.random()-0.5)*20.0;
    this.c1y = canvas.height/3.0;
    this.c2x = x+60 + (Math.random()-0.5)*20.0;
    this.c2y = canvas.height/3.0*2.0;
  }

  draw(time){
    ctx.beginPath();
    ctx.moveTo(this.sx, 0);
    ctx.bezierCurveTo(this.c1x + Math.sin(time/1000 + this.sx)*10, this.c1y, this.c2x, this.c2y, this.ex, canvas.height);
    ctx.stroke();
  }
}

let lines;

function drawStartScreen(){
  lines = [];
  for (let x = -canvas.width; x < canvas.width; x+=40){
    const line = new Line(x);
    lines.push(line);
  }
  animateStartScreen();
}

function animateStartScreen(){
  if (startScreen){
  const now = new Date().getTime();

  ctx.setLineDash([5, 5]);
  ctx.lineDashOffset = (now/40) % 10;
  ctx.fillStyle = "#fdfffd";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  lines.forEach(line => line.draw(now));
    window.requestAnimationFrame(animateStartScreen);
  }
}

drawStartScreen();