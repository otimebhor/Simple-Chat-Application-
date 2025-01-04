import { IsEnum } from 'class-validator';
import { OrderStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStatusDto {
  @ApiProperty({
    example: 'COMPLETED',
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
