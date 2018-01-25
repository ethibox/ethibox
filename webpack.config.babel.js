import 'babel-polyfill';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import BrowserSyncPlugin from 'browser-sync-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import UglifyJsPlugin from 'uglifyjs-webpack-plugin';
import GitRevisionPlugin from 'git-revision-webpack-plugin';
import webpack from 'webpack';
import { exec } from 'shelljs';
import yaml from 'yamljs';

const env = process.env.NODE_ENV || 'development';
const port = process.env.PORT || 4444;
const minikubeIp = (env === 'development') ? exec('minikube ip', { silent: true }).stdout.trim() : '';
const chartIndex = yaml.load(`${__dirname}/charts/packages/index.yaml`);
const listCharts = Object.values(chartIndex.entries).filter(([chart]) => chart.name !== 'ethibox').map(([chart]) => ({ ...chart, category: chart.keywords[0] }));
const gitRevisionPlugin = new GitRevisionPlugin({ lightweightTags: true });

const config = {
    entry: {
        index: [
            './src/client/js/index.js',
            './src/client/css/main.scss',
        ],
    },
    output: {
        path: `${__dirname}/public/static/`,
        filename: (env === 'production') ? 'bundle-[hash].js' : 'bundle.js',
        publicPath: '/',
    },
    module: {
        rules: [
            { test: /\.html$/, use: 'html-loader' },
            { test: /\.json$/, use: 'json-loader' },
            { test: /\.(njk|nunjucks)$/, use: 'nunjucks-loader' },
            { test: /\.jsx?$/, use: 'babel-loader', exclude: /node_modules/ },
            {
                test: /\.less$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: [
                        {
                            loader: 'css-loader',
                            options: {
                                minimize: { discardComments: { removeAll: true } },
                            },
                        },
                        { loader: 'less-loader' },
                    ],
                }),
            },
            {
                test: /\.s?css$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: [
                        {
                            loader: 'css-loader',
                            options: {
                                minimize: { discardComments: { removeAll: true } },
                            },
                        },
                        { loader: 'sass-loader' },
                        { loader: 'postcss-loader' },
                    ],
                }),
            },
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
            'process.env.NODE_PORT': JSON.stringify(port),
            'process.env.NODE_ENV': JSON.stringify(env),
            'process.env.MINIKUBE_IP': JSON.stringify(minikubeIp),
            'process.env.CHARTS': JSON.stringify(listCharts),
            'process.env.VERSION': JSON.stringify(gitRevisionPlugin.version()),
            'process.env.DEMO': JSON.stringify(process.env.DEMO),
        }),
        new ExtractTextPlugin({ filename: '[name].css', allChunks: false }),
        new UglifyJsPlugin({ uglifyOptions: { output: { comments: false } } }),
        new CopyWebpackPlugin([{ from: './static/' }]),
    ],
};

if (env === 'development') {
    config.plugins.push(
        new BrowserSyncPlugin({ proxy: `http://0.0.0.0:${port}` }),
        new BundleAnalyzerPlugin({ openAnalyzer: false, defaultSizes: 'gzip', analyzerMode: 'static' }),
    );
}

export default config;
