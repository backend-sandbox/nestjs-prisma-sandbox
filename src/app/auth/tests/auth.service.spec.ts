/* eslint-disable @typescript-eslint/unbound-method */
import { BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import bcryptjs from 'bcryptjs';
import { ERROR_CONSTANT, SUCCESS_CONSTANT } from '../../../common/constants';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AuthService } from '../auth.service';
import { AuthDto } from '../dto';

jest.mock('bcryptjs', () => ({
  hashSync: jest.fn(),
  compareSync: jest.fn(),
}));

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: typeof mockPrismaService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: 'user-id-123',
    email: 'test@example.com',
    password: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAuthDto: AuthDto = {
    email: 'test@example.com',
    password: 'password123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    it('should successfully create a new user', async () => {
      const hashedPassword = 'hashed-password-123';
      const mockToken = 'mock-jwt-token';

      prismaService.user.findUnique.mockResolvedValue(null);
      (bcryptjs.hashSync as jest.Mock).mockReturnValue(hashedPassword);
      prismaService.user.create.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue(mockToken);
      configService.get.mockImplementation((key: string) => {
        if (key === 'JWT_EXPIRES_IN') return '15m';
        if (key === 'JWT_SECRET') return 'test-secret';
        return undefined;
      });

      const result = await service.signup(mockAuthDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockAuthDto.email },
      });
      expect(bcryptjs.hashSync).toHaveBeenCalledWith(mockAuthDto.password, 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: mockAuthDto.email,
          password: hashedPassword,
        },
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: mockUser.id,
          email: mockUser.email,
        },
        {
          expiresIn: '15m',
          secret: 'test-secret',
        },
      );
      expect(result).toEqual({
        message: SUCCESS_CONSTANT.SIGN_UP_SUCCESS,
        accessToken: mockToken,
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.signup(mockAuthDto)).rejects.toThrow(
        new ConflictException(ERROR_CONSTANT.EMAIL_ALREADY_IN_USE),
      );
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockAuthDto.email },
      });
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should handle database errors during user creation', async () => {
      const hashedPassword = 'hashed-password-123';
      const dbError = new Error('Database connection failed');

      prismaService.user.findUnique.mockResolvedValue(null);
      (bcryptjs.hashSync as jest.Mock).mockReturnValue(hashedPassword);
      prismaService.user.create.mockRejectedValue(dbError);

      await expect(service.signup(mockAuthDto)).rejects.toThrow(dbError);
    });
  });

  describe('signin', () => {
    it('should successfully sign in a user with valid credentials', async () => {
      const mockToken = 'mock-jwt-token';

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcryptjs.compareSync as jest.Mock).mockReturnValue(true);
      jwtService.signAsync.mockResolvedValue(mockToken);
      configService.get.mockImplementation((key: string) => {
        if (key === 'JWT_EXPIRES_IN') return '15m';
        if (key === 'JWT_SECRET') return 'test-secret';
        return undefined;
      });

      const result = await service.signin(mockAuthDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockAuthDto.email },
      });
      expect(bcryptjs.compareSync).toHaveBeenCalledWith(
        mockAuthDto.password,
        mockUser.password,
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: mockUser.id,
          email: mockUser.email,
        },
        {
          expiresIn: '15m',
          secret: 'test-secret',
        },
      );
      expect(result).toEqual({
        message: SUCCESS_CONSTANT.SIGN_IN_SUCCESS,
        accessToken: mockToken,
      });
    });

    it('should throw BadRequestException if user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.signin(mockAuthDto)).rejects.toThrow(
        new BadRequestException(ERROR_CONSTANT.INVALID_CREDENTIALS),
      );
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockAuthDto.email },
      });
      expect(bcryptjs.compareSync).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if password is invalid', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcryptjs.compareSync as jest.Mock).mockReturnValue(false);

      await expect(service.signin(mockAuthDto)).rejects.toThrow(
        new BadRequestException(ERROR_CONSTANT.INVALID_CREDENTIALS),
      );
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockAuthDto.email },
      });
      expect(bcryptjs.compareSync).toHaveBeenCalledWith(
        mockAuthDto.password,
        mockUser.password,
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should handle JWT signing errors', async () => {
      const jwtError = new Error('JWT signing failed');

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcryptjs.compareSync as jest.Mock).mockReturnValue(true);
      jwtService.signAsync.mockRejectedValue(jwtError);
      configService.get.mockImplementation((key: string) => {
        if (key === 'JWT_EXPIRES_IN') return '15m';
        if (key === 'JWT_SECRET') return 'test-secret';
        return undefined;
      });

      await expect(service.signin(mockAuthDto)).rejects.toThrow(jwtError);
    });
  });

  describe('signToken (private method testing via public methods)', () => {
    it('should use correct JWT configuration', async () => {
      const mockToken = 'mock-jwt-token';
      const expiresIn = '30m';
      const secret = 'super-secret-key';

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcryptjs.compareSync as jest.Mock).mockReturnValue(true);
      jwtService.signAsync.mockResolvedValue(mockToken);
      configService.get.mockImplementation((key: string) => {
        if (key === 'JWT_EXPIRES_IN') return expiresIn;
        if (key === 'JWT_SECRET') return secret;
        return undefined;
      });

      await service.signin(mockAuthDto);

      expect(configService.get).toHaveBeenCalledWith('JWT_EXPIRES_IN');
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: mockUser.id,
          email: mockUser.email,
        },
        {
          expiresIn,
          secret,
        },
      );
    });
  });
});
