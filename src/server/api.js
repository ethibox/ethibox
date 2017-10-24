import express from 'express';

const api = express();

api.get('/', (req, res) => {
    res.json({ response: 'Hello api!' });
});

export default api;
