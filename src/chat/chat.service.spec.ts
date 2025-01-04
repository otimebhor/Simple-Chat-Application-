import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, Role } from '@prisma/client';
import { OrdersService } from '../orders/orders.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ChatService', () => {
  let chatService: ChatService;
  let prismaService: PrismaService;
  let orderService: OrdersService;

  const createOrderDto = {
    description: 'Sample Order',
    specifications: { color: 'red' },
    quantity: 10,
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatService, PrismaService, OrdersService],
    }).compile();

    chatService = module.get<ChatService>(ChatService);
    prismaService = module.get<PrismaService>(PrismaService);
    orderService = module.get<OrdersService>(OrdersService);

    prismaService.message.deleteMany({});
    prismaService.chatRoom.deleteMany({});
    prismaService.order.deleteMany({});
    prismaService.user.deleteMany({});
  });

  beforeEach(async () => {
    await prismaService.message.deleteMany({});
    await prismaService.chatRoom.deleteMany({});
    await prismaService.order.deleteMany({});
    await prismaService.user.deleteMany({});
    jest.clearAllMocks();
  });


  afterAll(async () => {
    await prismaService.$disconnect();
  });

  describe('createMessage', () => {
    it('should successfully create a message in an open chat room', async () => {
      const user = await prismaService.user.create({
        data: {
          username: 'test',
          email: 'user@example.com',
          password: 'password123',
          role: Role.USER,
        },
      });

      // Create an order for the user
      const order = await orderService.createOrder(user.id, createOrderDto);

      // Ensure the chat room is created only if it doesn't already exist
      const existingChatRoom = await prismaService.chatRoom.findUnique({
        where: { orderId: order.order.id },
      });

      let chatRoom;
      if (existingChatRoom) {
        chatRoom = existingChatRoom; // Use the existing chat room if it exists
      } else {
        // Create a new chat room if it doesn't exist
        chatRoom = await prismaService.chatRoom.create({
          data: { orderId: order.order.id, isClosed: false },
        });
      }

      const messageContent = 'This is a test message';
      const message = await chatService.createMessage(
        user.id,
        chatRoom.id,
        messageContent,
      );

      expect(message).toHaveProperty('id');
      expect(message.content).toBe(messageContent);
      expect(message.userId).toBe(user.id);
    });

  
  });

  describe('closeChatRoom', () => {
    it('should successfully close a chat room', async () => {
      const user = await prismaService.user.create({
        data: {
          username: 'test',
          email: 'user@example.com',
          password: 'password123',
          role: Role.USER,
        },
      });

      const order = await orderService.createOrder(user.id, createOrderDto);

      const existingChatRoom = await prismaService.chatRoom.findUnique({
        where: { orderId: order.order.id },
      });

      let chatRoom;
      if (existingChatRoom) {
        chatRoom = existingChatRoom; // Use the existing chat room if it exists
      } else {
        // Create a new chat room if it doesn't exist
        chatRoom = await prismaService.chatRoom.create({
          data: { orderId: order.order.id, isClosed: false },
        });
      }

      const summary = 'This is a summary of the chat';
      const result = await chatService.closeChatRoom(chatRoom.id, summary);

      expect(result.message).toBe('Chat has been closed');
      const updatedChat = await prismaService.chatRoom.findUnique({
        where: { id: chatRoom.id },
      });
      expect(updatedChat.isClosed).toBe(true);
      expect(updatedChat.summary).toBe(summary);

      const updatedOrder = await prismaService.order.findUnique({
        where: { id: order.order.id },
      });
      expect(updatedOrder.status).toBe(OrderStatus.PROCESSING);
    });

    it('should throw ForbiddenException if chat room not found', async () => {
      await expect(chatService.closeChatRoom(999, 'Summary')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('verifyUserAccess', () => {
    it('should allow admin to access any chat room', async () => {
      const admin = await prismaService.user.create({
        data: {
          username: 'admin',
          email: 'admin@example.com',
          password: 'password123',
          role: Role.ADMIN,
        },
      });

      const user = await prismaService.user.create({
        data: {
          username: 'test',
          email: 'user@example.com',
          password: 'password123',
          role: Role.USER,
        },
      });
      const order = await orderService.createOrder(user.id, createOrderDto);
      const existingChatRoom = await prismaService.chatRoom.findUnique({
        where: { orderId: order.order.id },
      });

      let chatRoom;
      if (existingChatRoom) {
        chatRoom = existingChatRoom; // Use the existing chat room if it exists
      } else {
        // Create a new chat room if it doesn't exist
        chatRoom = await prismaService.chatRoom.create({
          data: { orderId: order.order.id, isClosed: false },
        });
      }
      const result = await chatService.verifyUserAccess(admin.id, chatRoom.id);
      expect(result).toBe(true);
    });

    it('should allow user to access only their own chat room', async () => {
      const user = await prismaService.user.create({
        data: {
          username: 'test',
          email: 'user@example.com',
          password: 'password123',
          role: Role.USER,
        },
      });

      const otherUser = await prismaService.user.create({
        data: {
          username: 'test',
          email: 'otheruser@example.com',
          password: 'password123',
          role: Role.USER,
        },
      });

      const order = await orderService.createOrder(user.id, createOrderDto);
      const existingChatRoom = await prismaService.chatRoom.findUnique({
        where: { orderId: order.order.id },
      });

      let chatRoom;
      if (existingChatRoom) {
        chatRoom = existingChatRoom; // Use the existing chat room if it exists
      } else {
        // Create a new chat room if it doesn't exist
        chatRoom = await prismaService.chatRoom.create({
          data: { orderId: order.order.id, isClosed: false },
        });
      }

      const result = await chatService.verifyUserAccess(user.id, chatRoom.id);
      expect(result).toBe(true);

      const resultForOtherUser = await chatService.verifyUserAccess(
        otherUser.id,
        chatRoom.id,
      );
      expect(resultForOtherUser).toBe(false);
    });

    it('should throw NotFoundException if chat room not found', async () => {
      const user = await prismaService.user.create({
        data: {
          username: 'tester',
          email: 'user@example.com',
          password: 'password123',
          role: Role.USER,
        },
      });

      await expect(chatService.verifyUserAccess(user.id, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getChatSummary', () => {
 
    it('should return chat summary for valid user', async () => {
        const user = await prismaService.user.create({
          data: {
            username: 'tester',
            email: 'user@example.com',
            password: 'password123',
            role: Role.USER,
          },
        });
      
        const order = await orderService.createOrder(user.id, createOrderDto);
      
        // Check if the chat room already exists for the order
        let chatRoom = await prismaService.chatRoom.findUnique({
          where: { orderId: order.order.id },
        });
      
        if (!chatRoom) {
          // Create a new chat room if it doesn't exist
          chatRoom = await prismaService.chatRoom.create({
            data: {
              orderId: order.order.id,
              isClosed: false,
            },
          });
        }
      
        const message = await prismaService.message.create({
          data: {
            content: 'Test message',
            userId: user.id,
            chatRoomId: chatRoom.id,
          },
        });
      
        const result = await chatService.getChatSummary(user.id, chatRoom.id);
      
        expect(result.messages.length).toBe(1);
        expect(result.messages[0].content).toBe('Test message');
      });
      
    it('should throw ForbiddenException if user does not have access to the chat room', async () => {
      const user = await prismaService.user.create({
        data: {
          username: 'test1',
          email: 'user@example.com',
          password: 'password123',
          role: Role.USER,
        },
      });

      const otherUser = await prismaService.user.create({
        data: {
          username: 'test2',
          email: 'otheruser@example.com',
          password: 'password123',
          role: Role.USER,
        },
      });

 

      const order = await orderService.createOrder(user.id, createOrderDto);

      let chatRoom = await prismaService.chatRoom.findUnique({
        where: { orderId: order.order.id },
      });
    
      if (!chatRoom) {
        // Create a new chat room if it doesn't exist
        chatRoom = await prismaService.chatRoom.create({
          data: {
            orderId: order.order.id,
            isClosed: false,
          },
        });
      }
    

      await expect(
        chatService.getChatSummary(otherUser.id, chatRoom.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
