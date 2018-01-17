import 'babel-polyfill';
import express from 'express';
import aa from 'express-async-await';
import path from 'path';
import compression from 'compression';
import bodyParser from 'body-parser';
import http from 'http';
import api from './api';
import socketIo from './socketIo';

const app = aa(express());
const publicPath = (process.env.NODE_ENV === 'production') ? './' : '../../public/';

app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/api', api);
app.use('/static/', express.static(path.join(__dirname, publicPath)));
app.use('/charts/', express.static(path.join(__dirname, publicPath, '../charts/packages/')));

app.get(['/', '/register', '/login'], (req, res) => res.sendFile(path.join(__dirname, publicPath, 'index.html')));
app.get('*', (req, res) => res.status(404).send('Not found'));

const server = http.createServer(app);
socketIo(server);

server.listen(process.env.PORT || 4444);
