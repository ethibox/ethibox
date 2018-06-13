import 'babel-polyfill';
import express from 'express';
import aa from 'express-async-await';
import path from 'path';
import compression from 'compression';
import bodyParser from 'body-parser';
import http from 'http';
import graphql from './graphql';
import test from './test';
import './connector';

const app = aa(express());
const publicPath = (process.env.NODE_ENV === 'production') ? './' : '../../public/';

app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/', express.static(path.join(__dirname, publicPath, '/static')));
app.use('/graphql', graphql);

if (process.env.NODE_ENV !== 'production' || process.env.CI) {
    app.use('/test', test);
}

app.get('*', (req, res) => res.sendFile(path.join(__dirname, publicPath, '/static/index.html')));

const server = http.createServer(app);
server.listen(process.env.PORT || 4444);
