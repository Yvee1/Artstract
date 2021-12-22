function circumradius(p1, p2, p3) {
  const a = Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2);
  const b = Math.sqrt((p3.x - p2.x)**2 + (p3.y - p2.y)**2);
  const c = Math.sqrt((p1.x - p3.x)**2 + (p1.y - p3.y)**2);

  return (a * b * c) / Math.sqrt((a + b + c) * (b + c - a) * (c + a - b) * (a + b - c));
}

/**
 * Returns alpha-shape triangles and perimeter edges
 * @param {Array<Int>} triangles     - Delaunay triangulation represented by indices of points.
 * @param {Array<Coordinate>} coords - List of coordinates of the points
 * @param {Number} alpha             - Parameter alpha of the alpha-shape; as alpha -> infinity the alpha-shape approaches the convex hull.
 * 
 * Implementation: Steven
 */
function getAlphaShape(triangles, coords, alpha) {
  // We will filter the triangles based on alpha, and determine the perimeter edges of the resulting triangulation(s).
  const allEdges = [];
  const filteredTriangles = [];

  for (let i = 0; i < triangles.length; i+=3) {
    // Indices of the triangle vertices
    const t = [triangles[i], triangles[i+1], triangles[i+2]].sort();
    // Coordinates of the triangle vertices
    const p1 = coords[t[0]];
    const p2 = coords[t[1]];
    const p3 = coords[t[2]];
    // Calculate circumradius; should be < alpha to be in the alpha shape.
    const r = circumradius(p1, p2, p3);
    if (r < alpha) {
      filteredTriangles.push(t);

      allEdges.push([t[0], t[1]]);
      allEdges.push([t[1], t[2]]);
      allEdges.push([t[0], t[2]]);
    }
  }

  // Lexicographic sort
  allEdges.sort((a, b) => a[0] == b[0] ? a[1] - b[1] : a[0] - b[0]);

  // Perimeter edges are the ones occurring only once in the allEdges array.
  const perimeterEdges = [];
	for (let i = 0; i < allEdges.length; i++){
    if (i == 0){
      if (allEdges[i][0] != allEdges[i+1][0] || allEdges[i][1] != allEdges[i+1][1]){
	      perimeterEdges.push(allEdges[i]);
	    }
    } else if (i == allEdges.length - 1){
      if (allEdges[i][0] != allEdges[i-1][0] || allEdges[i][1] != allEdges[i-1][1]){
        perimeterEdges.push(allEdges[i]);
      }
    } else {
      if ((allEdges[i][0] != allEdges[i+1][0] || allEdges[i][1] != allEdges[i+1][1]) && (allEdges[i][0] != allEdges[i-1][0] || allEdges[i][1] != allEdges[i-1][1])){
        perimeterEdges.push(allEdges[i]);
      }
    }
	}
  
  return [filteredTriangles, perimeterEdges];
}

function ccwAngle(p1, p2, p3){
  // Angle of below would be approx. 3/4*pi
  //                p3
  //              /
  //            /
  // p1 ----- p2
  const x1 = p1.x - p2.x;
  const y1 = p1.y - p2.y;
  const x2 = p3.x - p2.x;
  const y2 = p3.y - p2.y;
  const dot = x1 * x2 + y1 * y2;
  const det = x1 * y2 - y1 * x2;
  return Math.atan2(det, dot);
}

function perimeterEdgesToPolygons(edges){
  // We first create a mapping from the edges. If vertex u has outgoing edges (u, v) and (u, w) then u is mapped to [v, w].
  const mapping = new Map();
  const polygons = [];
  const remainingVertices = new Set();

  for (let i = 0; i < edges.length; i++){
    if (mapping.has(edges[i][0])){
      mapping.get(edges[i][0]).push(edges[i][1]);
    } else {
      mapping.set(edges[i][0], [edges[i][1]]);
    }
    if (mapping.has(edges[i][1])){
      mapping.get(edges[i][1]).push(edges[i][0]);
    } else {
      mapping.set(edges[i][1], [edges[i][0]]);
    }
    remainingVertices.add(edges[i][0]);
  }

  while(remainingVertices.size > 0){
    const polygon = [];
    // Get a vertex from the set
    const start = remainingVertices.values().next().value;
    polygon.push(start);
    let current = start;
    let prev = -1;
    for (let i = 0; i < edges.length; i++){ // while(true) but just to prevent it going into an infinite loop in case of a mistake
      // Which vertices can be reached from current?
      const possibleNexts = mapping.get(current);
      if (possibleNexts.length == 0){
        break;
      }
      // Get the one with the smallest angle; this is the one in the same polygon.
      const next = prev < 0 ? possibleNexts[0] : possibleNexts.reduce((acc, x) => ccwAngle(prev, current, x) < ccwAngle(prev, current, acc) ? x : acc);
      // Remove it from the list
      possibleNexts.splice(possibleNexts.indexOf(next), 1);
      const nextPossibleNexts = mapping.get(next);
      nextPossibleNexts.splice(nextPossibleNexts.indexOf(current), 1);

      polygon.push(next);
      remainingVertices.delete(current);
      prev = current;
      current = next;
      // If we found a closed polygon we stop going around.
      if (current == start){
        break;
      }
    }
    polygons.push(polygon);
  }
  return polygons;
}
