/* eslint-disable no-undef */
var path = require('path');
var webpack = require('webpack');
var TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    devtool: 'source-map',
    entry: [
        './client/index'
    ],
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'bundle.js',
        publicPath: '/static/'
    },
    mode: 'production',
    plugins: [
    //new webpack.optimize.OccurenceOrderPlugin(),ac
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),
    /*new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false
      }
    })*/
    ],
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()],
    },
    module: {
        rules: [{
            test: /\.css$/,
            use: ['style-loader', 'css-loader']
        },{
            test: /\.s[ac]ss$/i,
            use: [
                // Creates `style` nodes from JS strings
                'style-loader',
                // Translates CSS into CommonJS
                'css-loader',
                // Compiles Sass to CSS
                'sass-loader',
            ],
        },{
            test: /\.js$/,
            use: ['babel-loader'],
            include: path.join(__dirname, 'client')
        },{
            test: /\.(woff|ttf|otf)$/i,
            type: 'asset/resource',
            generator: {
                filename: './fonts/[name][ext]',
            }
        },{
            test: /\.(png|jpg|svg)$/,
            type: 'asset/resource',
            generator: {
                filename: './img/[name][ext]'
            }
        },{
            test: /\.mp3$/,
            type: 'asset/resource',
            generator: {
                filename: './sounds/[name][ext]'
            }
        }]
    }
};
