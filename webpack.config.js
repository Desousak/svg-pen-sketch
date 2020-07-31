const path = require('path');

module.exports = {
    entry: './src/index.js',
    target: 'web', 
    output: {
        filename: 'svg-pen-sketch.js',
        path: path.resolve(__dirname, 'dist'),
        library: 'SvgPenSketch',
        libraryTarget: 'umd',
        umdNamedDefine: true,
    }
};