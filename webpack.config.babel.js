import HtmlWebpackPlugin from 'html-webpack-plugin';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import BrowserSyncPlugin from 'browser-sync-webpack-plugin';
import FaviconsWebpackPlugin from 'favicons-webpack-plugin';
import webpack from 'webpack';
import dotenv from 'dotenv';

dotenv.config({ silent: true });

module.exports = {
    entry: {
        index: [
            './src/client/js/index.js',
            './src/client/css/main.scss',
        ],
    },
    output: {
        path: `${__dirname}/public`,
        filename: 'bundle.js',
    },
    module: {
        rules: [
            { test: /\.html$/, use: 'html-loader' },
            { test: /\.json$/, use: 'json-loader' },
            { test: /\.(njk|nunjucks)$/, use: 'nunjucks-loader' },
            { test: /\.jsx?$/, use: 'babel-loader', exclude: /node_modules/ },
            { test: /\.less$/, use: ExtractTextPlugin.extract({ fallback: 'style-loader', use: ['css-loader', 'less-loader'] }) },
            { test: /\.s?css$/, use: ExtractTextPlugin.extract({ fallback: 'style-loader', use: ['css-loader', 'sass-loader', 'postcss-loader'] }) },
            {
                test: /\.(png|jpg|gif|svg|woff2?|eot|ttf)(\?.*)?$/,
                loader: 'url-loader',
                query: {
                    limit: 10000,
                    name: '[name]-[hash:7].[ext]',
                },
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: `${__dirname}/src/client/index.html`,
            hash: true,
        }),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        }),
        new ExtractTextPlugin({ filename: '[name].css', allChunks: false }),
        new webpack.optimize.UglifyJsPlugin({ comments: false }),
        new BrowserSyncPlugin({
            proxy: `0.0.0.0:${process.env.PORT}/`,
        }),
        new FaviconsWebpackPlugin('./favicon.png'),
    ],
};
