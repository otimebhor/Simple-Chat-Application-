import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'Content of the message',
  })
  @IsString()
  @IsNotEmpty()

  content: string;
}