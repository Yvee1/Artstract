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
      const newPoints = [];
      const x1 = Math.floor(node.x);
      const y1 = Math.floor(node.y);
      const x2 = Math.floor(node.x);
      const y2 = Math.floor(node.y + node.h-1);
      const x3 = Math.floor(node.x + node.w-1);
      const y3 = Math.floor(node.y);
      const x4 = Math.floor(node.x + node.w-1);
      const y4 = Math.floor(node.y + node.h-1);
      const x5 = Math.floor(node.x + node.w / 2);
      const y5 = Math.floor(node.y + node.h / 2);
      if (node.x == 0){
        newPoints.push(new Point(new Coordinate(x1 + xoff, y1 + yoff), new RGB(...getColor(x1, y1))));
        newPoints.push(new Point(new Coordinate(x2 + xoff, y2 + yoff), new RGB(...getColor(x2, y2))));
      }
      if (node.y == 0){
        newPoints.push(new Point(new Coordinate(x3 + xoff, y3 + yoff), new RGB(...getColor(x3, y3))));
      }
      newPoints.push(new Point(new Coordinate(x4 + xoff, y4 + yoff), new RGB(...getColor(x4, y4))));
      newPoints.push(new Point(new Coordinate(x5 + xoff, y5 + yoff), new RGB(...getColor(x5, y5))));
      const alpha = Math.sqrt(node.w**2 + node.h**2);
      newPoints.forEach(pt => { pt.alpha = alpha; qtPoints.push(pt) });
      continue;
    }
    stack.push(node.northWest);
    stack.push(node.northEast);
    stack.push(node.southWest);
    stack.push(node.southEast);
  }
  return qtPoints;
}