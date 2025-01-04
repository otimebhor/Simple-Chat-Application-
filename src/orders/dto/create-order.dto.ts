// src/orders/dto/create-order.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsObject,
} from 'class-validator';

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsObject()
  @IsOptional()
  specifications?: Record<string, any>;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  quantity: number;
}
