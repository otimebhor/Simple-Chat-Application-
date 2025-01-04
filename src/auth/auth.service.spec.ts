import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';

describe('AuthService ', () => {
  let authService: AuthService;
  let prismaService: PrismaService;

  // // Create mock register DTO
  const mockRegisterDto = {
    username: 'testuser',
    email: 'test1@example.com',
    password: 'password123',
    role: Role.USER,
  };

  const loginDto = {
    email: 'test1@example.com',
    password: 'password123',
  };

  jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('hashedPassword'),
    compare: jest.fn().mockResolvedValue(true),
  }));

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, PrismaService, JwtService],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);

    prismaService.chatRoom.deleteMany({});
    prismaService.order.deleteMany({});
    prismaService.user.deleteMany({});
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    await prismaService.chatRoom.deleteMany({});
    await prismaService.order.deleteMany({});
    await prismaService.user.deleteMany({});
  });

  afterAll(async () => {
    await prismaService.$disconnect();
  });

  it('should successfully register a new user', async () => {
    const result = await authService.register(mockRegisterDto);

    // Check the result
    expect(result).toEqual({
      message: 'User registered successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
      },
    });

    expect(result.message).toBe('User registered successfully');
    expect(result.user.email).toBe('test1@example.com');
  });

  it('should successfully login a user', async () => {
    await authService.register(mockRegisterDto);

    const result = await authService.login(loginDto);

    expect(result.message).toBe('Logged in successfully');
    expect(result.token).toBeDefined();
    expect(result.user.email).toBe('test1@example.com');
  });

  it('should throw an error if the email already exists during registration', async () => {
    // Register the user once
    await authService.register(mockRegisterDto);

    // Try registering the same user again
    await expect(authService.register(mockRegisterDto)).rejects.toThrowError(
      'Email is already in use',
    );
  });

  it('should throw an error for invalid login credentials', async () => {
    const invalidLoginDto = {
      email: 'invalid@example.com',
      password: 'wrongpassword',
    };

    await expect(authService.login(invalidLoginDto)).rejects.toThrowError(
      'Invalid email or password',
    );
  });
});

afterEach(() => {
  jest.resetAllMocks();
});
