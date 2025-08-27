// src/lib/socket.js
import { io } from "socket.io-client";
import { USE_API } from "./env";

const socket = io(USE_API, {
    transports: ["websocket"],
});

export default socket;