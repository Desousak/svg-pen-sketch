const path = require('path');

module.exports = {
    entry: './src/index.js',
    target: 'web', 
    output: {
        filename: 'svg-sketch.js',
        path: path.resolve(__dirname, 'dist'),
        library: 'SvgSketchJS',
        libraryTarget: 'umd',
        umdNamedDefine: true,
    },
    externals: {
        d3: 'd3'
    }
};