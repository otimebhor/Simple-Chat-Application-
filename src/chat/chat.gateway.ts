import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway()
export class ChatGateway {
  @WebSocketServer() server: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
  ) {}

  @SubscribeMessage('joinChat')
  async handleJoinChat(@MessageBody() orderId: number) {
    const chat = await this.prisma.chatRoom.findUnique({
      where: { orderId },
      include: { messages: true },
    });
    if (!chat) {
      return;
    }
    this.server.emit('chatHistory', chat.messages);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { orderId: number; userId: number; message: string },
  ) {
    const chat = await this.prisma.chatRoom.findUnique({
      where: { orderId: data.orderId },
    });

    if (chat.isClosed === true) {
      return; // Prevent sending messages if chat is closed
    }

    const message = await this.chatService.createMessage(
      data.userId,
      chat.id,
      data.message,
    );

    // const message = await this.prisma.message.create({
    //   data: {
    //     content: data.message,
    //     userId: data.userId,
    //     chatId: chat.id,
    //   },
    // });
    this.server.emit('newMessage', message);
  }

  @SubscribeMessage('closeChat')
  async handleCloseChat(
    @MessageBody() data: { chatRoomId: number; summary: string },
  ) {
    await this.chatService.closeChatRoom(data.chatRoomId, data.summary);
    this.server.emit('chatClosed', data.chatRoomId);
  }
}
