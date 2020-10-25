function getDist(x1, y1, x2, y2) {
    // Return the distance of point 2 (x2,y2) from point 1 (x1, y1)
    return Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2));
}

const MathExtras = {
    getDist: getDist
}

Object.freeze(MathExtras);
export default MathExtras;