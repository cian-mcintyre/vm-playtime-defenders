/* eslint-disable no-undef */
var path = require('path');
var webpack = require('webpack');

module.exports = {
    devtool: 'inline-source-map',
    entry: [
        'webpack-hot-middleware/client',
        './client/index'
    ],
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'bundle.js',
        publicPath: '/static/'
    },
    mode: 'development',
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin()
    ],
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
