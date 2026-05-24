/**
 * Implémentation du repository Message avec Prisma
 * Respecte l'interface IMessageRepository définie dans la couche application
 */
import { PrismaClient } from '@prisma/client';
import { Message } from '../../domain/entity/Message';
import { IMessageRepository } from '../../domain/repository/IMessageRepository';

export class PrismaMessageRepository implements IMessageRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Message | null> {
    const message = await this.prisma.message.findUnique({
      where: { id }
    });

    if (!message) {
      return null;
    }

    return new Message(
      message.id,
      message.content,
      message.senderId,
      message.receiverId,
      message.createdAt,
      message.readAt
    );
  }


  async findBetweenUsers(userId1: string, userId2: string): Promise<Message[]> {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 }
        ]
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return messages.map(message => new Message(
      message.id,
      message.content,
      message.senderId,
      message.receiverId,
      message.createdAt,
      message.readAt
    ));
  }


  async create(message: Message): Promise<Message> {
    const createdMessage = await this.prisma.message.create({
      data: {
        content: message.content,
        senderId: message.senderId,
        receiverId: message.receiverId,
        readAt: message.readAt
      }
    });

    return new Message(
      createdMessage.id,
      createdMessage.content,
      createdMessage.senderId,
      createdMessage.receiverId,
      createdMessage.createdAt,
      createdMessage.readAt
    );
  }


  async markAsRead(messageId: string): Promise<Message> {
    const updatedMessage = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        readAt: new Date()
      }
    });

    return new Message(
      updatedMessage.id,
      updatedMessage.content,
      updatedMessage.senderId,
      updatedMessage.receiverId,
      updatedMessage.createdAt,
      updatedMessage.readAt
    );
  }


  async findUnreadByReceiverId(receiverId: string): Promise<Message[]> {
    const messages = await this.prisma.message.findMany({
      where: {
        receiverId,
        readAt: null
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return messages.map(message => new Message(
      message.id,
      message.content,
      message.senderId,
      message.receiverId,
      message.createdAt,
      message.readAt
    ));
  }
}
