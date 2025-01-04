import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
  HttpException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Get,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { Role } from '@prisma/client';
import {
  ApiTags,
  ApiBearerAuth,
  ApiParam,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { RolesGuard } from '../guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { JwtAuthGuard } from '../guard/jwt-guard.guard';
import { SendMessageDto } from './dto/create-chat.dto';
import { GetCurrentUserId } from '../auth/decorators/get-current-user-id.decorator';

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chats')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post(':id/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiParam({
    name: 'chatId',
    type: Number,
    description: 'Chat id',
  })
  @ApiOperation({ summary: 'Close a chat' })
  @ApiNotFoundResponse({ description: 'Chat not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async closeChatRoom(
    @Param('id') id: number,
    @Body('summary') summary: string,
  ) {
    try {
      return this.chatService.closeChatRoom(id, summary);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      } else if (error instanceof BadRequestException) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      } else {
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Post(':chatRoomId/messages')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a message in a chat room' })
  @ApiNotFoundResponse({ description: 'Chat room not found' })
  @ApiParam({
    name: 'chatRoomId',
    type: Number,
    description: 'ChatRoom id',
  })
  @ApiForbiddenResponse({
    description: 'Chat room is closed',
  })
  async sendMessage(
    @Param('chatRoomId') chatRoomId: number,
    @Body() sendMessageDto: SendMessageDto,
    @GetCurrentUserId() userId: number,
  ) {
    try {
      // Check if user has access to the chat room
      const hasAccess = await this.chatService.verifyUserAccess(
        userId,
        chatRoomId,
      );
      if (!hasAccess) {
        throw new ForbiddenException(
          'You do not have access to this chat room',
        );
      }

      return this.chatService.createMessage(
        userId,
        chatRoomId,
        sendMessageDto.content,
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      } else if (error instanceof BadRequestException) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      } else if (error instanceof ForbiddenException) {
        throw new HttpException(error.message, HttpStatus.FORBIDDEN);
      } else {
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Get(':chatId/history')
  @ApiOperation({ summary: 'Get Chat History' })
  @ApiNotFoundResponse({ description: 'Chat room not found' })
  @ApiForbiddenResponse({
    description: 'You are not authorized to view this chat',
  })
  @ApiParam({
    name: 'chatId',
    type: Number,
    description: 'Chat Id',
  })
  async getChatHistory(
    @Param('chatId') chatId: number,
    @GetCurrentUserId() userId: number,
  ) {
    try {
      return this.chatService.getChatSummary(userId, chatId);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      } else if (error instanceof BadRequestException) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      } else if (error instanceof ForbiddenException) {
        throw new HttpException(error.message, HttpStatus.FORBIDDEN);
      } else {
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
