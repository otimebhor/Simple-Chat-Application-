// src/auth/dto/register.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Role } from '@prisma/client'; // Assuming Role is defined in your Prisma schema
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'johndoe@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'The role of the user either USER or ADMIN',
    example: 'USER or ADMIN',
  })
  @IsOptional()
  @IsEnum(Role)
  role: Role; // Admin or Regular
}
