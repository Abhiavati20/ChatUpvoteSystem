import { Message, server as WebSocketServer, connection } from "websocket";
import http from "http";
import { UserManager } from "./UserManager";
import { InMemoryStore } from "./Store/InMemoryStore";
import { IncomingMessage, SupportedMessage } from "./messages/IncomingMessages";
import { OutgoingMessage, SupportedOutgoingMessage } from "./messages/OutgoingMessages";

const httpServer = http.createServer(function (request: any, response: any) {
    console.log((new Date()) + " Received Request for " + request.url);
    response.writeHead(404);
    response.end();
});
const userManager = new UserManager()
const store = new InMemoryStore()
httpServer.listen(8080, function () {
    console.log((new Date()) + " Server is listening on port 8080");
})

const wsServer = new WebSocketServer({
    httpServer: httpServer,
    autoAcceptConnections:false
})

function originIsAllowed(origin: string) {
    return true;
}

wsServer.on("request", function (request: any) {
    if (!originIsAllowed(request.origin)) {
        request.reject();
        console.log((new Date()) + " Connection from origin " + request.origin + " rejected");
        return;
    }
    const connection = request.accept("echo-protocol", request.origin);
    console.log((new Date()) + " connection accepted");
    connection.on("message", function (message:any) {
        if (message.type === "utf8") {
            try {
                messageHandler(connection,JSON.parse(message.utf8Data))
            } catch (e) {
                console.log("ERROR",e)   
            }
            // console.log('Received Message: ' + message.utf8Data);
            // connection.sendUTF(message.utf8Data);
        }
        else if (message.type === "binary") {
            console.log("Received Binary Message of " + message.binary);
            connection.sendBytes(message.binaryData);
        }
    })
    connection.on("close", function (reasonCode: any, description: any) {
        console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected")
    })
})

function messageHandler(ws: connection,message: IncomingMessage) {
    if (message.type === SupportedMessage.JoinRoom) {
        const payload = message.payload;
        console.log("ADDING A USER");
        userManager.addUser(payload.name, payload.userId, payload.roomId,ws)
    }
    if (message.type === SupportedMessage.SendMessage) {
        const payload = message.payload
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
        const outgoingPayload: OutgoingMessage = {
            type: SupportedOutgoingMessage.AddChat,
            payload: {
                chatId: chat?.id,
                roomId: payload.roomId,
                message: payload.message,
                name: user.name,
                upvotes:0
            }
        }
        userManager.broadcast(payload.roomId,payload.userId,outgoingPayload)
    }
    
    if (message.type === SupportedMessage.UpvoteMessage) {
        const payload = message.payload;
        const chat = store.upvote(payload.userId, payload.roomId, payload.chatId);
        const user = userManager.getUser(payload.roomId, payload.userId);
        console.log("USER", user?.name)
        if (!chat) return;
        if (!user) return;
        const outgoingPayload: OutgoingMessage = {
            type: SupportedOutgoingMessage.UpdateChat,
            payload: {
                chatId:chat.id,
                roomId: payload.roomId,
                message: chat.message,
                name:user.name,
                upvotes:chat.upvotes.length
            }
        }
        userManager.broadcast(payload.roomId,payload.userId,outgoingPayload)
    }
}