class Coordinate {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  /* Returns whether this coordinate lies in the triangle */
  isInTriangle(triangle, coordList) {
    p1 = coordList[triangle[0]];
    p2 = coordList[triangle[1]];
    p3 = coordList[triangle[2]];

    const d1 = sign(this, p1, p2);
    const d2 = sign(this, p2, p3);
    const d3 = sign(this, p1, p3);

    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
    return !(hasNeg && hasPos);
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