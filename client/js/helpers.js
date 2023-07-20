// From: http://codepen.io/bungu/pen/rawvJe

/**
 * Generates vertices for asteroid polygon with certain count and radius
 * @param  {Number} count   Number of vertices
 * @return {Array}        Array of vertices: {x: Number, y: Number}
 */
export function asteroidVertices(count, rad) {
    const p = [];

    for (let i = 0; i < count; i++) {
        const angle = (360 / count) * i * Math.PI / 180;
        const x = Math.cos(angle) * rad;
        const y = Math.sin(angle) * rad;

        p[i] = { x, y };
    }

    return p;
}

/**
 * Rotate point around center on certain angle
 * @param {Object} p        {x: Number, y: Number}
 * @param {Object} center   {x: Number, y: Number}
 * @param {Number} angle    Angle in radians
 */
export function rotatePoint(p, center, angle) {
    return {
        x: ((p.x - center.x) * Math.cos(angle) - (p.y - center.y) * Math.sin(angle)) + center.x,
        y: ((p.x - center.x) * Math.sin(angle) + (p.y - center.y) * Math.cos(angle)) + center.y
    };
}

/**
 * Random Number between 2 numbers
 */
export function randomNumBetween(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Random Number between 2 numbers excluding a certain range
 */
export function randomNumBetweenExcluding(min, max, exMin, exMax) {
    let random = randomNumBetween(min, max);

    while (random > exMin && random < exMax) {
        random = Math.random() * (max - min) + min;
    }

    return random;
}

/**
* Random min or max number
*/
export function randomOneOfTwo(min, max) {
    const random = randomNumBetween(min, max);

    return random > 0 ? max : min;
}