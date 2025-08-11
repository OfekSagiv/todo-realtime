require('dotenv').config();
const http = require('http');
const app = require('./app');

const PORT = Number(process.env.PORT || 3000);
const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
});
