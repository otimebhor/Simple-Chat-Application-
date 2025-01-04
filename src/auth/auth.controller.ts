import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ConflictException,
  BadRequestException,
  HttpException,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register-user.dto.ts';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto.ts';
import { RolesGuard } from '../guard/roles.guard';
import { JwtAuthGuard } from '../guard/jwt-guard.guard';
import { Roles } from './decorators/roles.decorators';
import { Role } from '@prisma/client';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  logger: any;
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'User Sign up' })
  @ApiConflictResponse({ description: 'Email is already in use' })
  @ApiCreatedResponse({ description: 'User registered successfully'})
  @HttpCode(HttpStatus.CREATED)
  create(@Body() registerDto: RegisterDto) {
    try {
      return this.authService.register(registerDto);
    } catch (error) {
      this.logger.error(error.message);
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

  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiBadRequestResponse({ description: 'Invalid email or password' })
  @ApiOkResponse({ description: 'Logged in successfully'})
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    try {
      return this.authService.login(loginDto);
    } catch (error) {
      console.log(error);
      this.logger.error(error.message);
      if (error instanceof BadRequestException) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      } else {
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Post('create-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an admin' })
  @ApiConflictResponse({ description: 'Email is already in use' })
  @ApiCreatedResponse({ description: 'Admin created successfully'})
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  @ApiForbiddenResponse({
    description: 'You are not allowed to access this resource.',
  })
  @HttpCode(HttpStatus.CREATED)
  createAdmin(@Body() registerDto: RegisterDto) {
    try {
      return this.authService.createAdmin(registerDto);
    } catch (error) {
      console.log(error);
      this.logger.error(error.message);
      if (error instanceof BadRequestException) {
        throw new HttpException(error.message, HttpStatus.FORBIDDEN);
      } else if (error instanceof ForbiddenException) {
        throw new HttpException(
          error.message || 'You are not allowed to access this resource.',
          HttpStatus.FORBIDDEN,
        );
      } else {
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
