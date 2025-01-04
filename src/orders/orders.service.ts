import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(userId: number, createOrderDto: CreateOrderDto) {
    const { description, specifications, quantity } = createOrderDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    const order = await this.prisma.order.create({
      data: {
        description,
        specifications,
        quantity,
        userId,
        status: OrderStatus.REVIEW,
        chatRoom: {
          create: {},
        },
      },
      include: {
        chatRoom: true,
      },
    });

    this.logger.log(`Order Service - An order was created`);
    return {
      message: 'Order was created successfullly',
      order,
    };
  }

  // async getOrders(userId: number) {
  //   const orders = await this.prisma.order.findMany({
  //     where: { userId: userId },
  //   });
  //   return orders;
  // }

  async updateStatus(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.COMPLETED },
    });
  }
}
