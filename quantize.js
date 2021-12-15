
let pixels = undefined;
let output = undefined;

/**
 * Returns array of k colors present in image.
 * @param {Element} image
 * @param {Number} k
 * @return {Array} colors
 *
 * Implementation: Martijn
 * Requires that k is a power of two.
 */
function quantize(data, k) {
    /* Create an array of pixel indices. */
    pixels = Array.from(Array(data.length >> 2).keys());

    output = Array(0);
    cut(0, pixels.length, data, 16);
    return output;
}

/**
 * Perform a mediancut iteration on pixels[i:j] (j excluded),
 * i.e. generate k colours from pixels[i:j].
 * @param {Number} i
 * @param {Number} j
 * @param {Array} data
 * @param {Number} k
 */
function cut(i, j, data, k) {

    /* Base case. */
    if (k == 1) {
        /* Generate color based on pixels[i..j] */
        let R = 0, G = 0, B = 0;
        for (let ii = i; ii < j; ii++) {
            let idx = 4*pixels[ii];
            R += data[idx+0];
            G += data[idx+1];
            B += data[idx+2];
        }
        R = (R / (j-i)) | 0;
        G = (G / (j-i)) | 0;
        B = (B / (j-i)) | 0;
        output.push([R, G, B]);
        return
    }

    /* Not base case. */
    /* First, find which colour component has the greatest range. */
    let C = getLargestComponent(i, j, data);

    /* Save the last value in pixels[i:j], to restore it later. */
    /* It might be that this value is in multiple intervals,
       so it needs to be restored before returning. */
    let last_pixel = pixels[j-1];

    /* Sort pixels[i:j] by the largest component. */
    sortRange(i, j, data, C);

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

    cut(i, medl, data, k >> 1);
    cut(medr, j, data, k >> 1);

    /* Restore the value of pixels[j-1]. */
    pixels[j-1] = last_pixel;
}

function getLargestComponent(i, j, data) {

    let Rmin = 255, Rmax = 0;
    let Gmin = 255, Gmax = 0;
    let Bmin = 255, Bmax = 0;
    for (let ii = i; ii < j; ii++) {
        let idx = 4*pixels[ii];

        Rmin = Math.min(Rmin, data[idx+0]);
        Rmax = Math.max(Rmax, data[idx+0]);

        Gmin = Math.min(Gmin, data[idx+1]);
        Gmax = Math.max(Gmax, data[idx+1]);

        Bmin = Math.min(Bmin, data[idx+2]);
        Bmax = Math.max(Bmax, data[idx+2]);

    }

    let Rrange = Rmax - Rmin;
    let Grange = Gmax - Gmin;
    let Brange = Bmax - Bmin;

    if (Rrange >= Grange && Rrange >= Brange) { return 0; }
    if (Grange >= Rrange && Grange >= Brange) { return 1; }
    return 2;

}

function sortRange(i, j, data, C) {

    pixels.splice(i, j-i, ...pixels.slice(i,j).sort((a,b) => data[4*a+C] - data[4*b+C]));

}