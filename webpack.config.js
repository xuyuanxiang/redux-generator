/**
 * @name
 * @author xuyuanxiang
 * @date 16/8/17
 */
var webpack = require('webpack');
var pkg = require('./package.json');
var util = require('util');

module.exports = {
    entry: './src/generator.js',
    output: {
        library: pkg.name,
        libraryTarget: "umd",
        filename: util.format("./lib/%s.min.js", pkg.name)
    },
    // externals: [
    //     {
    //         lodash: {
    //             root: "_",
    //             commonjs: "lodash",
    //             commonjs2: "lodash",
    //             amd: "lodash"
    //         }
    //     }
    // ],
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
