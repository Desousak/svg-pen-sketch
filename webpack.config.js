const path = require('path');

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'canvas.js',
        path: path.resolve(__dirname, 'dist'),
        library: 'canvasdrawjs'
    },
};