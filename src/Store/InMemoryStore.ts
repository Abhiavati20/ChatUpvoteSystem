import { Store, Chat, UserId } from "./Store";
let globalChatId = 0;
export interface Room {
    roomId: string,
    chats: Chat[]
}

export class InMemoryStore implements Store{
    private store: Map<string, Room>;
    constructor() {
        this.store = new Map<string, Room>()
    }
    initRoom(roomId: string) {
        this.store.set(roomId, {
            roomId,
            chats:[]
        })
        return this.store.get(roomId);
    }
    getRoom(roomId: string) {
        return this.store.get(roomId);
    }
    // last 50 chats => limit = 50, offset = 0;
    // next 50 chats => limit = 50 offset = 50
    getChats(roomId: string, limit: number, offset: number) {
        const room = this.store.get(roomId);
        if (!room) {
            return [];
        }
        return room.chats.reverse().slice(offset,limit)
     }
    addChat(userId:UserId, name:string, message:string, roomId:string) { 
        if (!this.store.get(roomId)) {
            this.initRoom(roomId);
        }
        let room = this.store.get(roomId);
        if (!room) {
            return;
        }
        const chat = {
            id:(globalChatId++).toString(),
            userId,
            name,
            message,
            upvotes: []
        }
        room.chats.push(chat);
        return chat;
    }
    upvote(userId: UserId, roomId: string, chatId: string) {
        const room = this.store.get(roomId);
        if (!room) {
            return;
        }
        const chat = room.chats.find(({ id }) => id === chatId);
        
        if (chat) {
            chat.upvotes.push(userId)
        }
        return chat;
    }
}