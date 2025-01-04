import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, Role } from '@prisma/client';

describe('OrdersService', () => {
  let ordersService: OrdersService;
  let prismaService: PrismaService;

  const createOrderDto = {
    description: 'Sample Order',
    specifications: { color: 'red' },
    quantity: 10,
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersService, PrismaService],
    }).compile();

    ordersService = module.get<OrdersService>(OrdersService);
    prismaService = module.get<PrismaService>(PrismaService);

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

  describe('createOrder', () => {
    it('should create a new order and return the order data', async () => {
      const mockUser = await prismaService.user.create({
        data: {
          username: 'test',
          email: 'test@example.com',
          password: 'hashedPassword', // You can mock the password hash if needed
          role: Role.USER,
        },
      });

      const result = await ordersService.createOrder(
        mockUser.id,
        createOrderDto,
      );

      expect(result.message).toBe('Order was created successfullly');
      expect(result.order.description).toBe('Sample Order');
      expect(result.order.status).toBe(OrderStatus.REVIEW);
    });
  });
  describe('updateStatus', () => {
    it('should update the order status to COMPLETED', async () => {
      const mockUser = await prismaService.user.create({
        data: {
          username: 'test',
          email: 'test1@example.com',
          password: 'hashedPassword', // You can mock the password hash if needed
          role: Role.USER,
        },
      });

      const order = await ordersService.createOrder(
        mockUser.id,
        createOrderDto,
      );

      const result = await ordersService.updateStatus(order.order.id);

      expect(result.status).toBe(OrderStatus.COMPLETED);
    });
  });
});
