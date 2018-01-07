import 'babel-polyfill';
import express from 'express';
import aa from 'express-async-await';
import path from 'path';
import compression from 'compression';
import bodyParser from 'body-parser';
import socketIo from 'socket.io';
import http from 'http';
import api from './api';
import { listApplications } from './k8sClient';

const app = aa(express());

const PORT = process.env.PORT || 4444;
const publicPath = (process.env.NODE_ENV === 'production') ? './' : '../../public/';

app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/api', api);
app.use('/static/', express.static(path.join(__dirname, publicPath)));
app.use('/charts/', express.static(path.join(__dirname, publicPath, '../charts/packages/')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, publicPath, 'index.html'));
});

app.get('*', (req, res) => {
    res.status(404).send('Not found');
});

const server = http.createServer(app);
const io = socketIo(server);

setInterval(async () => {
    const apps = await listApplications();
    io.sockets.emit('listApplications', apps);
}, 5000);

io.on('connection', async (socket) => {
    const apps = await listApplications();
    socket.emit('listApplications', apps);
});

server.listen(PORT, () => {
    console.log(`Express server running at http://0.0.0.0:${PORT}/`);
});
