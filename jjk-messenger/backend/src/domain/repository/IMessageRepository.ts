/**
 * Interfaces de repository pour Message
 * Définit les contrats que les implémentations concrètes doivent respecter
 */

import { type Message } from "../entity/Message";



export interface IMessageRepository {
  findById(id: string): Promise<Message | null>;
  findBetweenUsers(userId1: string, userId2: string): Promise<Message[]>;
  create(message: Message): Promise<Message>;
  markAsRead(messageId: string): Promise<Message>;
  findUnreadByReceiverId(receiverId: string): Promise<Message[]>;
}
