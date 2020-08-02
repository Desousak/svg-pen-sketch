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
    },
    module: {
        rules: [
            {
                test: /\.js$/, //using regex to tell babel exactly what files to transcompile
                exclude: /node_modules/, // files to be ignored
                use: {
                    loader: 'babel-loader' // specify the loader
                }
            }
        ]
    }
};