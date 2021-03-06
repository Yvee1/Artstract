/**
 * Computes area of triangle
 * https://www.geeksforgeeks.org/check-whether-a-given-point-lies-inside-a-triangle-or-not/
 */
function area(a, b, c) {
  return Math.abs((a.x*(b.y-c.y) + b.x*(c.y-a.y)+ c.x*(a.y-b.y)));
}

class Coordinate {
  constructor(x, y) {
    this.x = Math.round(x);
    this.y = Math.round(y);
  }

  toString() {
    return `(${this.x}, ${this.y})`;
  }

  /**
   * Checks if point is in or on triangle.
   * 
   * https://www.geeksforgeeks.org/check-whether-a-given-point-lies-inside-a-triangle-or-not/
   */
  isInTriangle(triangle, coordList) {
    const a = coordList[triangle.v1];
    const b = coordList[triangle.v2];
    const c = coordList[triangle.v3];

    const A = area(a, b, c);
  
    // Calculate area of triangle PBC
    const A1 = area(this, b, c);
    // Calculate area of triangle PAC
    const A2 = area(a, this, c);
    // Calculate area of triangle PAB
    const A3 = area(a, b, this);
    
    return (A === A1 + A2 + A3);
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

  /** 
   * Checks if p lies on edge
   * https://stackoverflow.com/questions/11907947/how-to-check-if-a-point-lies-on-a-line-between-2-other-points
   */
  liesOnEdge(edge, p, coordList) {
    const p1 = coordList[edge.u];
    const p2 = coordList[edge.v];

    const testPoint = coordList[p];
    const dxc = testPoint.x - p1.x;
    const dyc = testPoint.y - p1.y;

    const dxl = p2.x - p1.x;
    const dyl = p2.y - p1.y;

    const cross = dxc * dyl - dyc * dxl;

    return (cross === 0)
  }

  /** Returns the edge on which p lies or null if it does not exist. */
  getTriangleEdgeIfOnEdge(p, coordList) {
    for (let i = 0; i < this.edges.length; i++) {
      const edge = this.edges[i];
      if (this.liesOnEdge(edge, p, coordList)) {
        return edge;
      }
    }
    return null;
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

  /** https://stackoverflow.com/questions/39984709/how-can-i-check-wether-a-point-is-inside-the-circumcircle-of-3-points/44875841 */
  isStoredCounterClockWise(coordList) {
    const a = coordList[this.v1];
    const b = coordList[this.v2];
    const c = coordList[this.v3];
    return (b.x - a.x)*(c.y - a.y)-(c.x - a.x)*(b.y - a.y) > 0;
  }

  /** https://stackoverflow.com/questions/39984709/how-can-i-check-wether-a-point-is-inside-the-circumcircle-of-3-points/44875841 */
  circumCircleContains(p, coordList, storedCCW) {
    let a = coordList[this.v1];
    let b = coordList[this.v2];
    let c = coordList[this.v3];
    if (!storedCCW) {
      a = coordList[this.v3];
      c = coordList[this.v1];
    }
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
    if (!this.isInTriangle(edge)) throw "Cannot find opposite of edge not in Triangle";

    for (let i = 0; i < this.vertices.length; i++) {
      const v = this.vertices[i];
      if (v != edge.u && v != edge.v) {
        return v;
      }
    }
  }

  toString(coordList) {
    const a = coordList[this.v1].toString();
    const b = coordList[this.v2].toString();
    const c = coordList[this.v3].toString();
    return `Triangle(${a}, ${b}, ${c})`;
  }
}