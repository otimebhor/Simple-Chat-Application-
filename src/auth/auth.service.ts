import {
  Injectable,
  ConflictException,
  Logger,
  BadRequestException,
  // UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register-user.dto.ts';
import { LoginDto } from './dto/login.dto.ts';
import * as dotenv from 'dotenv';
import { Role } from '@prisma/client';

dotenv.config();

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, email, password, role } = registerDto;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role,
      },
    });
    this.logger.log(
      `Auth Service - User Registration - ${user.email} was registered successfully e`,
    );
    return {
      message: 'User registered successfully',
      user: { id: user.id, email: user.email },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid email or password');
    }

    // Generate JWT
    const payload = { sub: user.id, role: user.role };
    const token = this.jwtService.sign(payload, {
      secret: process.env.secret,
      expiresIn: '7d',
    });

    this.logger.log(`${user.email} logged in successfully`);
    return {
      message: 'Logged in successfully',
      user: { id: user.id, email: user.email, role: user.role },
      token: token,
    };
  }

  async createAdmin(registerDto: RegisterDto) {
    const { username, email, password } = registerDto;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });
    this.logger.log(
      `Auth Service - Admin Creation - ${user.email} was added as an admin`,
    );
    return {
      message: 'Admin created successfully',
      user: { id: user.id, email: user.email },
    };
  }
}
