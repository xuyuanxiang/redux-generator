/**
 * @name
 * @author xuyuanxiang
 * @date 16/8/17
 */
var webpack = require('webpack');
var util = require('util');
const env = process.env.NODE_ENV;

const configs = {
    entry: {generator: './src/generator.js'},
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
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(env)
        }),
    ]
}

if (env === 'production') {
    configs.plugins.push(...[new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            },
            output: {
                comments: false
            },
            compressor: {
                pure_getters: true,
                unsafe: true,
                unsafe_comps: true,
                warnings: false
            }
        }),
        new webpack.BannerPlugin("This source code is licensed under MIT: http://www.opensource.org/licenses/mit-license.php \nAuthor\tYuanxiang Xu @http://xuyuanxiang.me \nContact\tchaos@xuyuanxiang.cn")
    ]);
}
module.exports = configs;
