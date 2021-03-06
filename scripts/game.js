const canvas = document.getElementById("pixi-canvas");
const ctx = canvas.getContext('2d');
let startScreen = true;
let image, imgData, w, h, xoff, yoff, points, fewerPoints, groupedPoints;
let quadtree, dels, alphaShapes, polygons, searchStructures, coordLists, selectedPolygon, alphas;
let prevK, prevMaxDepth;
let gui, options;

const r = 2; // Radius of circles when drawing points

canvas.parentElement.addEventListener("mousedown", function(evt){
  const rect = canvas.getBoundingClientRect();
  const pos = new Coordinate(evt.clientX - rect.left, evt.clientY - rect.top);
  if (searchStructures){
    focus(pos);
  }
});

document.addEventListener('keydown', function(e){
  const change = 1.5
  if (selectedPolygon !== undefined){
    if (e.key == 'ArrowDown' || e.key == 'Down'){
      alphas[selectedPolygon] /= change;
    }
    if (e.key == 'ArrowUp' || e.key == 'Up'){
      alphas[selectedPolygon] *= change;
    }
  
    computeAlphaShape();
    drawArt();
  }
})

function focus(pos){
  var found = -1;
  for (let i = searchStructures.length - 1; i >= 0; i--){
    const result = searchStructures[i].getTriangleNodeContaining(pos, delCoordLists[i]);
    if (result != false && !result.containing && result.filtered) {
      found = i;
      break;
    }
  }
  if (found >= 0 && found != selectedPolygon){
    selectedPolygon = found;
    drawArt();
  } else if (selectedPolygon !== undefined){
    selectedPolygon = undefined;
    drawArt();
  }
}

function createGUI(){
  gui = new dat.GUI({name: 'Artstract GUI'});
  options = {
    alpha: 60.0,
    maxAlpha: 2.5,
    offset: 10.0,
    dropout: 0.6,
    k: 4,
    minDepth: 1,
    maxDepth: 8,
    gaps: 0,
    showPoints: false,
    showPolygons: true,
    showTriangles: false,
    showImage: false,
    showQuadtree: false,
    showQuadtreeOutline: true,
    debug: true,
    showOutline: false,
    showQuantizedPoints: false,
    quantizedPointsIndex: 0,
    showTriangulation: false,
    triangulationIndex: 0,
    saveImage: function(e) {
      const link = document.createElement('a');
      link.download = 'download.png';
      link.href = canvas.toDataURL();
      link.click();
      link.delete;
    }
  }

  prevK = options.k;
  prevMaxDepth = options.maxDepth;

  kController = gui.add(options, 'k', 1, 6, 1)
  kController.name("#colors (2^k)")
  kController.onFinishChange(() => { if (prevK != options.k) { 
    prevK = options.k; selectedPolygon = undefined; computePointsFromImage(); computeAndDraw() }
  });

  gui.add(options, 'maxDepth', 1, 9, 1)
    .onFinishChange(() => { 
      if (prevMaxDepth != options.maxDepth){ 
        prevMaxDepth = options.maxDepth; computePointsFromImage(); computeAndDraw() } 
      })
    .name("detail");
  gui.add(options, 'maxAlpha', 0, 5).onFinishChange(() => { computeAlphas(); computeAlphaShape(); drawArt() }).name("limit alpha");
  gui.add(options, 'saveImage')

  const layers = gui.addFolder('Layers');
  layers.closed = false;
  layers.add(options, 'showImage').name("show image").onChange(() => { drawArt() });
  layers.add(options, 'showQuadtree').onChange(() => { drawArt() }).name("show quadtree");
  layers.add(options, 'showPoints').onChange(() => { drawArt() }).name("show points");
  layers.add(options, 'showTriangulation').onChange(() => { drawArt() }).name("show triangulation");
  layers.add(options, 'showPolygons').onChange(() => { drawArt() }).name("show polygons");

  layerSettings = gui.addFolder('Layer settings');
  layerSettings.add(options, 'showQuadtreeOutline').onChange(() => { drawArt() }).name("quadtree outline");
  layerSettings.add(options, 'showQuantizedPoints').onChange(() => { drawArt() }).name("quantized points");
  layerSettings.add(options, 'quantizedPointsIndex').onChange(() => { drawArt() }).name("quantized index");
  layerSettings.add(options, 'triangulationIndex').onChange(() => { drawArt() }).name("triangulation index");
  layerSettings.add(options, 'showOutline').onChange(() => { drawArt() }).name("polygon outline");

  // debugController = debugFolder.add(options, 'debug');
  // debugController.name("use our Delaunay")
  // debugController.onChange(() => drawArt());

  // showTrianglesController = debugFolder.add(options, 'showTriangles')
  // showTrianglesController.onChange(() => { drawArt() });
}

function drawPoints(points){
  for (let i = 0; i < points.length; i++){
    const point = points[i];
    // ctx.strokeStyle = "black";
    ctx.fillStyle = `rgb(${point.color.r}, ${point.color.g}, ${point.color.b})`;
    ctx.beginPath();
    ctx.arc(point.pos.x, point.pos.y, r, 0, 2*Math.PI);
    ctx.fill();
    // ctx.stroke();
  }
}

function drawQuantizedPoints(index){
  // for (let index = 0; index < groupedPoints.length; index++){
    const color = palette[index];
    const pts = groupedPoints[index];
    for (let i = 0; i < pts.length; i++){
      const point = pts[i];
      // ctx.strokeStyle = "black";
      ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
      ctx.beginPath();
      ctx.arc(point.pos.x, point.pos.y, r, 0, 2*Math.PI);
      ctx.fill();
      // ctx.stroke();
    }
  // }
}

function computePointsFromImage() {
  // Make an offscreen canvas to render the image on
  const imgCanvas = document.createElement("canvas");
  const imgCtx = imgCanvas.getContext("2d");
  const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
  w = Math.floor(image.width * scale);
  h = Math.floor(image.height * scale);
  imgCanvas.width = w;
  imgCanvas.height = h;
  // Draw the image on the canvas
  xoff = (canvas.width-w)/2;
  yoff = (canvas.height-h)/2
  imgCtx.drawImage(image, 0, 0, w, h);
  // Get pixel data of canvas, and thus of the image
  imgData = imgCtx.getImageData(0, 0, w, h).data;

  quadtree = makeQuadtree(imgData, w, h, options.minDepth, options.maxDepth);
  points = pointsFromQuadtree(quadtree);
  points = points.sort().filter(function(item, pos, array) {
      return pos == 0 || item.pos.x != array[pos - 1].pos.x || item.pos.y != array[pos - 1].pos.y;
  });
  shuffleArray(points);
  groupedPoints = quantize(points, 2**options.k);
}

function drawQuadtree(node){
  if (node.subdivided){
    drawQuadtree(node.northWest);
    drawQuadtree(node.northEast);
    drawQuadtree(node.southWest);
    drawQuadtree(node.southEast);
  } else {
    if (options.showQuadtreeOutline){
      ctx.strokeStyle = "black";
    } else {
      ctx.strokeStyle = `rgb(${node.color[0]}, ${node.color[1]}, ${node.color[2]})`;
    }
    ctx.strokeRect(xoff + node.x, yoff + node.y, node.w, node.h);
    if (selectedPolygon === undefined){
      ctx.fillStyle = `rgb(${node.color[0]}, ${node.color[1]}, ${node.color[2]})`;
    } else {
      ctx.fillStyle = `rgb(${node.color[0]}, ${node.color[1]}, ${node.color[2]}, 0.1)`;
    }
    ctx.fillRect(xoff + node.x, yoff + node.y, node.w, node.h);
  }
}

function imageDataFromPoints(points){
  const imgData = [];
  for (let i = 0; i < points.length; i++){
    imgData.push(points[i].color.r, points[i].color.g, points[i].color.b, 1.0);
  }
  return imgData;
}

function computeDelaunay(){
  searchStructures = [];
  coordLists = [];
  delCoordLists = [];
  dels = [];
  groupedPoints.forEach (pts => {
    let coordList = pts.map(p => p.pos);

    // Compute Delaunay triangulation
    const output = getDelaunayTriangulationIncremental(coordList);
    dels.push(output[0]);
    coordLists.push(coordList);
    delCoordLists.push(output[1]);
    searchStructures.push(output[2]);
  });
}

function computeAlphas(){
  alphas = [];
  groupedPoints.forEach ((pts, index) => {
    alphas[index] = completeWeightedAlphaShape(dels[index], coordLists[index], pts, options.gaps, options.maxAlpha);
  });
}

function computeAlphaShape(){
  alphaShapes = [];
  polygons = [];
  groupedPoints.forEach ((pts, index) => {
    // Compute Alpha shape
    const alphaShape = getWeightedAlphaShape(dels[index], coordLists[index], alphas[index], pts);
    alphaShapes.push(alphaShape);
    polygons.push(perimeterEdgesToPolygons(alphaShape[1]));
  });
}

function computeAndDraw(){
  computeDelaunay();
  computeAlphas();
  computeAlphaShape();
  drawArt();
}

function drawArt() {
  ctx.setLineDash([]);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (options.showImage){
    ctx.save();
    if (selectedPolygon !== undefined){
      ctx.globalAlpha = 0.1;
    }
    ctx.drawImage(image, xoff, yoff, w, h);
    ctx.restore();
  }

  if (options.showQuadtree){
    ctx.save();
    if (selectedPolygon !== undefined){
      ctx.globalAlpha = 0.1;
    }
    drawQuadtree(quadtree);
    ctx.restore();
  }

  // Draw points
  if (options.showPoints){
    if (options.showQuantizedPoints){
      if (options.quantizedPointsIndex >= 0 && options.quantizedPointsIndex < 2**options.k){
        drawQuantizedPoints(options.quantizedPointsIndex);
      }
    } else {
      drawPoints(points);
    }
  }

  if (options.showTriangulation){
    for (let index = 0; index < groupedPoints.length; index++){
      const color = palette[index];
      const del = dels[index];
      const coordList = coordLists[index];

      if (options.triangulationIndex === index){
        for (let i = 0; i < del.length; i++){
          if (Math.max(del[i].v1, del[i].v2, del[i].v3) < coordList.length){
            ctx.lineWidth = 1;
            ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]}, 1.0)`;
            ctx.strokeStyle = "black";
            ctx.beginPath();
            ctx.moveTo(coordList[del[i].v1].x, coordList[del[i].v1].y);
            ctx.lineTo(coordList[del[i].v2].x, coordList[del[i].v2].y);
            ctx.lineTo(coordList[del[i].v3].x, coordList[del[i].v3].y);
            ctx.lineTo(coordList[del[i].v1].x, coordList[del[i].v1].y);
            ctx.fill();
            ctx.stroke();
          }
        }
      }
    }
  }

  if (options.showPolygons){
    for (let index = 0; index < groupedPoints.length; index++){
      const color = palette[index];
      const alphaShape = alphaShapes[index];
      const coordList = coordLists[index];

        const alphaTriangles = alphaShape[0];

        // Draw inside of alpha shapes
        ctx.lineWidth = 1;
        ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]}, 1.0)`;
        ctx.strokeStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]}, 1.0)`;
        if (selectedPolygon !== undefined && selectedPolygon !== index){
          ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]}, 0.1)`;
          ctx.strokeStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]}, 0.1)`;
        }
        alphaTriangles.forEach(polygon => {
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
          if (selectedPolygon === undefined || selectedPolygon == index){
            polygons[index].forEach(polygon => {
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
    }
  }
}

class Line {
  constructor(x){
    // Start and end x-positions of the curve
    this.sx = x + (Math.random()-0.5)*20.0;
    this.ex = x + 150.0 + (Math.random()-0.5)*20.0;

    // Control points
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
    ctx.lineWidth = 1;
    ctx.lineDashOffset = (now/40) % 10;
    ctx.fillStyle = "#fdfffd";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#555";
    lines.forEach(line => line.draw(now));
    window.requestAnimationFrame(animateStartScreen);
  }
}

drawStartScreen();