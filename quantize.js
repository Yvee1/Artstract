
let pixels = undefined;
let output = undefined;
let data   = undefined;
const cDistFunc = colourDistanceEuclidean;

/**
 * Returns array of k colors present in image.
 * @param {Element} image
 * @param {Number} k
 * @return {Array} colors
 *
 * Implementation: Martijn
 * Requires that k is a power of two.
 */
function quantize(imageData, k) {

    data = imageData;

    /* Create an array of pixel indices. */
    pixels = Array.from(Array(data.length >> 2).keys());

    output = Array(0);
    cut(0, pixels.length, k);

    /* Output now should contain k colours. */
    /* Time to find which colour is closest. */
    const CC = Array(pixels.length).fill(0).map(findNearestColour);

    return output;

}

/**
 * Perform a mediancut iteration on pixels[i:j] (j excluded),
 * i.e. generate k colours from pixels[i:j].
 * @param {Number} i
 * @param {Number} j
 * @param {Number} k
 */
function cut(i, j, k) {

    /* Base case. */
    if (k == 1) {
        /* Generate color based on pixels[i..j] */
        let R = 0, G = 0, B = 0;
        for (let ii = i; ii < j; ii++) {
            const idx = 4*pixels[ii];
            R += data[idx+0]**2;
            G += data[idx+1]**2;
            B += data[idx+2]**2;
        }
        R = Math.sqrt((R / (j-i))) | 0;
        G = Math.sqrt((G / (j-i))) | 0;
        B = Math.sqrt((B / (j-i))) | 0;
        output.push([R, G, B]);
        return
    }

    /* Not base case. */
    /* First, find which colour component has the greatest range. */
    const C = getLargestComponent(i, j);

    /* Save the last value in pixels[i:j], to restore it later. */
    /* It might be that this value is in multiple intervals, */
    /* so it needs to be restored before returning. */
    const last_pixel = pixels[j-1];

    /* Sort pixels[i:j] by the largest component. */
    sortRange(i, j, C);

    /* Get the median. */
    let medl = undefined, medr = undefined;
    if ((j - i) & 1 == 0) {
        // even
        medl = i + ((j-i) >> 1);
        medr = medl + 1;
    }
    else {
        // odd
        medl = medr = i + ((j - i + 1) >> 1);
    }

    /* Recurse. */
    cut(i, medl, k >> 1);
    cut(medr, j, k >> 1);

    /* Restore the value of pixels[j-1]. */
    pixels[j-1] = last_pixel;
}

function getLargestComponent(i, j) {

    let Rmin = 255, Rmax = 0;
    let Gmin = 255, Gmax = 0;
    let Bmin = 255, Bmax = 0;

    /* Find the min/max value for each component. */
    for (let ii = i; ii < j; ii++) {
        const idx = 4*pixels[ii];

        Rmin = Math.min(Rmin, data[idx+0]);
        Rmax = Math.max(Rmax, data[idx+0]);

        Gmin = Math.min(Gmin, data[idx+1]);
        Gmax = Math.max(Gmax, data[idx+1]);

        Bmin = Math.min(Bmin, data[idx+2]);
        Bmax = Math.max(Bmax, data[idx+2]);
    }

    const Rrange = Rmax - Rmin;
    const Grange = Gmax - Gmin;
    const Brange = Bmax - Bmin;

    if (Rrange >= Grange && Rrange >= Brange) { return 0; }
    if (Grange >= Rrange && Grange >= Brange) { return 1; }
    return 2;

}

function sortRange(i, j, C) {

    pixels.splice(i, j-i, ...pixels.slice(i,j).sort((a,b) => data[4*a+C] - data[4*b+C]));

}

/**
 * Find which colour in `output` is the closest to the `index`th colour in the image.
 * @param {Number} element   Don't care about this ;)
 * @param {Number} index     The index in the original array, i.e. the how-manieth colour.
 */
function findNearestColour(element, index) {
    const RGB = data.slice(4*index, 4*index + 4);

    let minDistance = Infinity;
    let minIndex = -1;

    /* Find the closest colour in output. */
    for (const [i, oRGB] of output.entries()) {
        const distance = cDistFunc(RGB, oRGB);
        if (distance < minDistance) {
            minDistance = distance;
            minIndex = i;
        }
    }

    return minIndex;
}

function colourDistanceEuclidean(c1, c2) {
    const [ R,  G,  B] = c1;
    const [oR, oG, oB] = c2;
    return (R - oR)**2 + (G - oG)**2 + (B - oB)**2;
}