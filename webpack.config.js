/**
 * @name
 * @author xuyuanxiang
 * @date 16/8/17
 */
var webpack = require('webpack');
var util = require('util');

module.exports = {
    entry: {generator: './src/generator.js', errorTranslator: './src/errorTranslator.js'},
    output: {
        library: '[name]',
        libraryTarget: "umd",
        filename: "./lib/[name].js"
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel',
            }
        ]
    },
    plugins: [
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            },
            output: {
                comments: false
            }
        }),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.BannerPlugin("This source code is licensed under MIT: http://www.opensource.org/licenses/mit-license.php \nAuthor\tYuanxiang Xu @http://xuyuanxiang.me \nContact\tchaos@xuyuanxiang.cn")
    ]
}
