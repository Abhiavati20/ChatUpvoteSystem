"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryStore = void 0;
let globalChatId = 0;
class InMemoryStore {
    constructor() {
        this.store = new Map();
    }
    initRoom(roomId) {
        this.store.set(roomId, {
            roomId,
            chats: []
        });
        return this.store.get(roomId);
    }
    getRoom(roomId) {
        return this.store.get(roomId);
    }
    // last 50 chats => limit = 50, offset = 0;
    // next 50 chats => limit = 50 offset = 50
    getChats(roomId, limit, offset) {
        const room = this.store.get(roomId);
        if (!room) {
            return [];
        }
        return room.chats.reverse().slice(offset, limit);
    }
    addChat(userId, name, message, roomId) {
        if (!this.store.get(roomId)) {
            this.initRoom(roomId);
        }
        let room = this.store.get(roomId);
        if (!room) {
            return;
        }
        console.log("ROOM", room);
        const chat = {
            id: (globalChatId++).toString(),
            userId,
            name,
            message,
            upvotes: []
        };
        console.log("CHAT", chat);
        room.chats.push(chat);
        console.log("ROOM CHATS", room.chats);
        return chat;
    }
    upvote(userId, roomId, chatId) {
        const room = this.store.get(roomId);
        if (!room) {
            return;
        }
        console.log("ROOM", room);
        const chat = room.chats.find(({ id }) => id === chatId);
        console.log("CHAT", chat);
        if (chat) {
            chat.upvotes.push(userId);
        }
        return chat;
    }
}
exports.InMemoryStore = InMemoryStore;
