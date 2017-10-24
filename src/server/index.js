import express from 'express';
import path from 'path';
import compression from 'compression';
import bodyParser from 'body-parser';
import api from './api';

const app = express();
const { PORT } = process.env;

app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/api', api);

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname)));

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));
    });
} else {
    app.use(express.static(path.join(__dirname, '../../public')));

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../../public', 'index.html'));
    });
}

app.get('*', (req, res) => {
    res.status(404).send('Not found');
});

app.listen(PORT, () => {
    console.log(`Express server running at http://0.0.0.0:${PORT}/`);
});
