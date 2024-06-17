"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const websocket_1 = require("websocket");
const http_1 = __importDefault(require("http"));
const UserManager_1 = require("./UserManager");
const InMemoryStore_1 = require("./Store/InMemoryStore");
const IncomingMessages_1 = require("./messages/IncomingMessages");
const OutgoingMessages_1 = require("./messages/OutgoingMessages");
const httpServer = http_1.default.createServer(function (request, response) {
    console.log((new Date()) + " Received Request for " + request.url);
    response.writeHead(404);
    response.end();
});
const userManager = new UserManager_1.UserManager();
const store = new InMemoryStore_1.InMemoryStore();
httpServer.listen(8080, function () {
    console.log((new Date()) + " Server is listening on port 8080");
});
const wsServer = new websocket_1.server({
    httpServer: httpServer,
    autoAcceptConnections: false
});
function originIsAllowed(origin) {
    return true;
}
wsServer.on("request", function (request) {
    if (!originIsAllowed(request.origin)) {
        request.reject();
        console.log((new Date()) + " Connection from origin " + request.origin + " rejected");
        return;
    }
    const connection = request.accept("echo-protocol", request.origin);
    console.log((new Date()) + " connection accepted");
    connection.on("message", function (message) {
        if (message.type === "utf8") {
            try {
                messageHandler(connection, JSON.parse(message.utf8Data));
            }
            catch (e) {
                console.log("ERROR", e);
            }
            // console.log('Received Message: ' + message.utf8Data);
            // connection.sendUTF(message.utf8Data);
        }
        else if (message.type === "binary") {
            console.log("Received Binary Message of " + message.binary);
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on("close", function (reasonCode, description) {
        console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected");
    });
});
function messageHandler(ws, message) {
    if (message.type === IncomingMessages_1.SupportedMessage.JoinRoom) {
        const payload = message.payload;
        console.log("ADDING A USER");
        userManager.addUser(payload.name, payload.userId, payload.roomId, ws);
    }
    if (message.type === IncomingMessages_1.SupportedMessage.SendMessage) {
        const payload = message.payload;
        const user = userManager.getUser(payload.roomId, payload.userId);
        if (!user) {
            console.error("User not found in the room");
            return;
        }
        let chat = store.addChat(payload.userId, user.name, payload.message, payload.roomId);
        if (!chat) {
            console.error("CHAT not found in the room");
            return;
        }
        const outgoingPayload = {
            type: OutgoingMessages_1.SupportedOutgoingMessage.AddChat,
            payload: {
                chatId: chat === null || chat === void 0 ? void 0 : chat.id,
                roomId: payload.roomId,
                message: payload.message,
                name: user.name,
                upvotes: 0
            }
        };
        userManager.broadcast(payload.roomId, payload.userId, outgoingPayload);
    }
    if (message.type === IncomingMessages_1.SupportedMessage.UpvoteMessage) {
        const payload = message.payload;
        const chat = store.upvote(payload.userId, payload.roomId, payload.chatId);
        const user = userManager.getUser(payload.roomId, payload.userId);
        console.log("USER", user === null || user === void 0 ? void 0 : user.name);
        if (!chat)
            return;
        if (!user)
            return;
        const outgoingPayload = {
            type: OutgoingMessages_1.SupportedOutgoingMessage.UpdateChat,
            payload: {
                chatId: chat.id,
                roomId: payload.roomId,
                message: chat.message,
                name: user.name,
                upvotes: chat.upvotes.length
            }
        };
        userManager.broadcast(payload.roomId, payload.userId, outgoingPayload);
    }
}
