class QuadtreeNode {
  constructor(x, y, w, h, color){
    this.subdivided = false;
    this.northWest = undefined;
    this.northEast = undefined;
    this.southWest = undefined;
    this.southEast = undefined;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.color = color;
  }
}

const qt = {data: undefined, width: undefined, height: undefined, minDepth: undefined, maxDepth: undefined};
function makeQuadtree(imageData, imageWidth, imageHeight, minDepth, maxDepth){
  qt.data = imageData;
  qt.width = imageWidth;
  qt.height = imageHeight;
  qt.minDepth = minDepth;
  qt.maxDepth = maxDepth;
  const root = subdivide(0, 0, qt.width, qt.height, 1);
  return root;
}

function getColor(x, y){
  const index = 4 * (x + y * qt.width);
  return [qt.data[index], qt.data[index+1], qt.data[index+2]];
}

// Based on https://jrtechs.net/photography/segmenting-images-with-quadtrees
function subdivide(x, y, w, h, depth){
  let mean = [0, 0, 0];
  for (let dx = 0; dx < w; dx++){
    for (let dy = 0; dy < h; dy++){
      let index = 4 * (x + dx + (y + dy) * qt.width);
      mean[0] += qt.data[index];
      mean[1] += qt.data[index+1];
      mean[2] += qt.data[index+2];
    }
  }
  mean[0] /= w*h;
  mean[1] /= w*h;
  mean[2] /= w*h;

  let mse = [0, 0, 0];
  for (let dx = 0; dx < w; dx++){
    for (let dy = 0; dy < h; dy++){
      let index = 4 * (x + dx + (y + dy) * qt.width);
      mse[0] += Math.abs(qt.data[index] - mean[0])**2;
      mse[1] += Math.abs(qt.data[index+1] - mean[1])**2;
      mse[2] += Math.abs(qt.data[index+2] - mean[2])**2;
    }
  }
  mse[0] /= w*h;
  mse[1] /= w*h;
  mse[2] /= w*h;

  const dev = mse[0] * 0.2989 + mse[1] * 0.5870 + mse[2] * 0.1140;

  const node = new QuadtreeNode(x, y, w, h, mean);

  if ((dev > 100 && w > 2 && h > 2 && depth < qt.maxDepth) || depth < qt.minDepth){
    node.subdivided = true;
    const w1 = Math.floor(w/2);
    const h1 = Math.floor(h/2);
    const w2 = Math.ceil(w/2);
    const h2 = Math.ceil(h/2);
    node.northWest = subdivide(x, y, w1, h1, depth+1);
    node.northEast = subdivide(x + w1, y, w2, h1, depth+1);
    node.southWest = subdivide(x, y+h1, w1, h2, depth+1);
    node.southEast = subdivide(x + w1, y+h1, w2, h2, depth+1);

    return node;
  } else {
    return node;
  }
}

function pointsFromQuadtree(root){
  const qtPoints = [];
  const stack = [root];
  while (stack.length > 0){
    const node = stack.pop();

    if (!node.subdivided){
      const x = Math.floor(node.x + node.w/2);
      const y = Math.floor(node.y + node.h/2);
      qtPoints.push(new Point(new Coordinate(x + xoff, y + yoff), new RGB(...getColor(x, y))));
      continue;
    }
    stack.push(node.northWest);
    stack.push(node.northEast);
    stack.push(node.southWest);
    stack.push(node.southEast);
  }
  return qtPoints;
}