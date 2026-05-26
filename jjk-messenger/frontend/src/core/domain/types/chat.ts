import type { Message } from "../entities/message";
import type { User } from "../entities/user";

export type SendMessageRequest = {
  receiverId: string;
  content: string;
};

export type UsersResponse = {
  users: User[];
};

export type MessagesResponse = {
  messages: Message[];
};
