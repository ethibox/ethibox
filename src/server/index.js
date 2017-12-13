import express from 'express';
import aa from 'express-async-await';
import path from 'path';
import compression from 'compression';
import bodyParser from 'body-parser';
import api from './api';

const app = aa(express());
const { PORT } = process.env;
const publicPath = (process.env.NODE_ENV === 'production') ? './' : '../../public/';

app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/api', api);
app.use('/static/', express.static(path.join(__dirname, publicPath)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, publicPath, 'index.html'));
});

app.get('*', (req, res) => {
    res.status(404).send('Not found');
});

app.listen(PORT, () => {
    console.log(`Express server running at http://0.0.0.0:${PORT}/`);
});
