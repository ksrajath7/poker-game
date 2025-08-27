import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import healthCheck from './routes/healthCheck.js';
import socketManager from './sockets/index.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use('/health', healthCheck);

socketManager(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Poker server running on port ${PORT}`));
