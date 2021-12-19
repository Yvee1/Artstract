class Coordinate {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  /* Returns whether this coordinate lies in the triangle */
  isInTriangle(triangle, coordList) {
    const p1 = coordList[triangle.v1];
    const p2 = coordList[triangle.v2];
    const p3 = coordList[triangle.v3];
    if (this === p1 || this === p2 || this === p3) {
      return true;
    }

    const d1 = sign(this, p1, p2);
    const d2 = sign(this, p2, p3);
    const d3 = sign(this, p3, p1);

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

/**
 * Undirected edge class.
 */
class Edge {
  /**
   * @param {Point location in coordList} u
   * @param {Point location in coordlist} v
   */
  constructor(u, v) {
    this.u = u;
    this.v = v;
  }

  /**
   * @param {Edge} e  
   * @returns if undirected edge equals this
   */
  equals(e) {
    return ((e.u === this.u && e.v == this.v) || (e.u === this.v && e.v == this.u));
  }

  draw(coordList) {
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(coordList[this.u].x, coordList[this.u].y);
    ctx.lineTo(coordList[this.v].x, coordList[this.v].y);
    ctx.stroke();
  }
  
  /** Return Euclidian distance between this.u, this.v. */
  getLength(coordList) {
    const c1 = coordList[this.u];
    const c2 = coordList[this.v];

    return Math.sqrt(Math.pow(c1.x - c2.x, 2) + Math.pow(c1.y - c2.y, 2));
  }
}

class Triangle {
  constructor(v1, v2, v3) {
    this.v1 = v1;
    this.v2 = v2;
    this.v3 = v3;
    this.vertices = [this.v1, this.v2, this.v3];

    this.edges = this.getEdges();
  }

  getEdges() {
    return [
      new Edge(this.v1, this.v2),
      new Edge(this.v2, this.v3),
      new Edge(this.v1, this.v3)
    ]
  }

  /** Check whether edge e is an edge of the triangle. */
  isInTriangle(e) {
    return this.edges.some(edge => {
      return edge.equals(e);
    });
  }

  draw(coordList) {
    this.edges.forEach(edge => {
      edge.draw(coordList);
    })
  }

  /**TODO: code from SO */
  isStoredCounterClockWise(coordList) {
    const a = coordList[this.v1];
    const b = coordList[this.v2];
    const c = coordList[this.v3];
    return (b.x - a.x)*(c.y - a.y)-(c.x - a.x)*(b.y - a.y) > 0;
  }

  /**TODO: code from SO */
  circumCircleContains(p, coordList) {
    const a = coordList[this.v1];
    const b = coordList[this.v2];
    const c = coordList[this.v3];
    const d = coordList[p];
    let ax_ = a.x-d.x;
    let ay_ = a.y-d.y;
    let bx_ = b.x-d.x;
    let by_ = b.y-d.y;
    let cx_ = c.x-d.x;
    let cy_ = c.y-d.y;
    return (
        (ax_*ax_ + ay_*ay_) * (bx_*cy_-cx_*by_) -
        (bx_*bx_ + by_*by_) * (ax_*cy_-cx_*ay_) +
        (cx_*cx_ + cy_*cy_) * (ax_*by_-bx_*ay_)
    ) > 0;
  }

  /** Returns the vertex opposite of an edge in the triangle. */
  getOppositeVertex(edge) {
    // check whether edge actually of triangle
    if (!this.edges.some(e => e.equals(edge))) throw "Cannot find opposite of edge not in Triangle";

    for (let i = 0; i < this.vertices.length; i++) {
      const v = this.vertices[i]
      if (v != edge.u && v != edge.v) {
        return v;
      }
    }
  }

  toString() {
    return f`Triangle({this.v1}, {this.v2}, {this.v3})`;
  }
}