import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, Role } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createMessage(userId: number, chatRoomId: number, content: string) {
    const chatRoom = await this.prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
      include: { order: true },
    });

    if (!chatRoom) throw new NotFoundException('Chat room not found');
    if (chatRoom.isClosed) throw new ForbiddenException('Chat room is closed');

    const message = await this.prisma.message.create({
      data: {
        content,
        userId,
        chatRoomId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return message;
  }

  async closeChatRoom(chatRoomId: number, summary: string) {
    const chatRoom = await this.prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
      include: { order: true },
    });

    if (!chatRoom) throw new ForbiddenException('Chat room not found');

    await this.prisma.$transaction([
      this.prisma.chatRoom.update({
        where: { id: chatRoomId },
        data: {
          isClosed: true,
          summary,
        },
      }),
      this.prisma.order.update({
        where: { id: chatRoom.order.id },
        data: {
          status: OrderStatus.PROCESSING,
        },
      }),
    ]);

    return {
      message: 'Chat has been closed',
    };
  }

  async verifyUserAccess(userId: number, chatRoomId: number): Promise<boolean> {
    const chatRoom = await this.prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
      include: {
        order: true,
      },
    });

    if (!chatRoom) {
      throw new NotFoundException('Chat room not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    // Admins can access all chat rooms
    if (user.role === Role.ADMIN) {
      return true;
    }

    // Regular users can only access their own orders' chat rooms
    return chatRoom.order.userId === userId;
  }

  async getChatSummary(userId: number, chatRoomId: number) {
    const chatRoom = await this.prisma.chatRoom.findUnique({
      where: {
        id: chatRoomId, 
      },
      include: {
        order: true,
        messages: true,
      },
    });

    if (!chatRoom) {
      throw new NotFoundException('Chat room not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isAdmin = user.role === Role.ADMIN;
    const isOrderOwner = chatRoom.order.userId === user.id;

    if (!isAdmin && !isOrderOwner) {
      throw new ForbiddenException('You do not have access to this chat room');
    }

    return {
      id: chatRoom.id,
      orderId: chatRoom.order.id,
      isClosed: chatRoom.isClosed,
      summary: chatRoom.summary,
      order: {
        id: chatRoom.order.id,
        description: chatRoom.order.description,
        status: chatRoom.order.status,
      },
      messages: chatRoom.messages.map((message) => ({
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        user: {
          id: message.userId,
        },
      })),
    };
  }
}
