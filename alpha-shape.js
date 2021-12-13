function circumradius(p1, p2, p3) {
  const a = Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2);
  const b = Math.sqrt((p3.x - p2.x)**2 + (p3.y - p2.y)**2);
  const c = Math.sqrt((p1.x - p3.x)**2 + (p1.y - p3.y)**2);

  return (a * b * c) / Math.sqrt((a + b + c) * (b + c - a) * (c + a - b) * (a + b - c));
}

/**
 * Returns alpha-shape edges
 * @param {Array<Coordinate>} del - input set
 * @param {Number} alpha
 * 
 * Implementation: Steven
 */
function getAlphaShape(del, coords, alpha) {
  // Assumption: for every triangle the vertices are in counter-clockwise order.

  // Shorthand
  const triangles = del.triangles;

  // We will filter the triangles based on alpha, and determine the perimeter edges of the resulting triangulation(s).
  const allEdges = [];
  const filteredTriangles = [];

  for (let i = 0; i < triangles.length; i+=3) {
    // Indices of the triangle vertices
    // const t0 = triangles[i];
    // const t1 = triangles[i+1];
    // const t2 = triangles[i+2];
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
      // // These are the edges of the triangle, we'll determine which are perimeter edges.
      // const edges = [[t0, t1], [t1, t2], [t2, t0]];
      // for (let i = 0; i < edges.length; i++) {
      //   const edge = edges[i];
      //   const flippedEdge = edge.slice().reverse();
      //   // If this is the first time we encounter this edge (regardless of direction) it is a candidate perimeter edge.
      //   if (!allEdges.some(e => (e[0] == edge[0] && e[1] == edge[1]) || (e[0] == flippedEdge[0] && e[1] == flippedEdge[1]))){
      //     allEdges.push(edge);
      //     perimeterEdges.push(edge);
      //   } else { 
      //     // An edge is a perimeter edge iff we encounter it exactly once. 
      //     //So if we have encoutnered the edge before, it is no longer a candidate perimeter edge, therefore remove it.
      //     perimeterEdges = perimeterEdges.filter(e => !(e[0] == edge[0] && e[1] == edge[1]) && !(e[0] == flippedEdge[0] && e[1] == flippedEdge[1]));
      //   }
      // }
    }
  }

  // Lexicographic sort...
  allEdges.sort((a, b) => (a[0] - b[0])*10000 + (a[1] - b[1]));
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
      // Get the one with the smallest angle; this is the one in the same polygon.
      const next = prev < 0 ? possibleNexts[0] : possibleNexts.reduce((acc, x) => ccwAngle(prev, current, x) < ccwAngle(prev, current, acc) ? x : acc);
      // Remove it from the list
      possibleNexts.splice(possibleNexts.indexOf(next), 1);

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

// function pointInsidePolygon(point, poly){
//   // TODO
// }

// function polygonsToNestedPolygons(polygons){
//   const nestedPolygons = [];
//   const inner = new Set();
//   for (let i = 0; i < polygons.length; i++){
//     if (inner.has(i)){
//       continue;
//     }
//     const p1 = polygons[i];
//     nestedPolygons.push([p1]);
//     for (let j = 0; i < polygons.length; j++){
//       if (i == j){
//         continue;
//       }
//       const p2 = polygons[j];
//       if (p2.some(point => !pointInsidePolygon(point, p1))){
//         continue;
//       }
//       // Now: p2 nested in p1
//       inner.add(j);
//       nestedPolygons[nestedPolygons.length - 1].push(p2);
//     }
//   }
//   return nestedPolygons;
// }