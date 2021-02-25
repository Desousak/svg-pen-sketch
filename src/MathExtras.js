function getDist(x1, y1, x2, y2) {
    // Return the distance of point 2 (x2,y2) from point 1 (x1, y1)
    return Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2));
}

function lerp (val1, val2, amnt) {
    amnt = amnt < 0 ? 0 : amnt;
    amnt = amnt > 1 ? 1 : amnt;
    return (1-amnt) * val1 + amnt * val2;
}

const MathExtras = {
    getDist: getDist,
    lerp: lerp
}

Object.freeze(MathExtras);
export default MathExtras;