const express = require('express');
const app = express();

const port = process.env.PORT || 8080;

app.get('*', (req, res) => {
    res.json({
        message: 'Test server working',
        port: port,
        path: req.path,
        headers: req.headers
    });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Test server running on port ${port}`);
});