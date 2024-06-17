export enum SupportedOutgoingMessage{
    AddChat = "ADD_CHAT",
    UpdateChat = "UPDATE_CHAT",
}

type MessagePayload = {
    roomId: string;
    message: string;
    name: string;
    upvotes: number;
    chatId:string
}

export type OutgoingMessage = {
    type: SupportedOutgoingMessage.AddChat,
    payload: MessagePayload
} |  {
    type: SupportedOutgoingMessage.UpdateChat,
    payload: MessagePayload
}

