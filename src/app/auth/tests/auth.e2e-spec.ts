/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import bcryptjs from 'bcryptjs';
import request from 'supertest';
import { ERROR_CONSTANT, SUCCESS_CONSTANT } from '../../../common/constants';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AuthModule } from '../auth.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user-id-123',
    email: 'test@example.com',
    password: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const validAuthDto = {
    email: 'test@example.com',
    password: 'password123',
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findUnique: jest.fn(),
          create: jest.fn(),
        },
      })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn().mockImplementation((key: string) => {
          switch (key) {
            case 'JWT_SECRET':
              return 'test-secret-key';
            case 'JWT_EXPIRES_IN':
              return '15m';
            default:
              return undefined;
          }
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/auth/signup (POST)', () => {
    it('should successfully register a new user', async () => {
      const hashedPassword = 'hashed-password-123';
      jest.spyOn(bcryptjs, 'hashSync').mockReturnValue(hashedPassword);
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(validAuthDto)
        .expect(201);

      expect(response.body).toHaveProperty(
        'message',
        SUCCESS_CONSTANT.SIGN_UP_SUCCESS,
      );
      expect(response.body).toHaveProperty('accessToken');
      expect(typeof response.body.accessToken).toBe('string');
      expect(response.body.accessToken.length).toBeGreaterThan(0);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: validAuthDto.email },
      });
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: validAuthDto.email,
          password: hashedPassword,
        },
      });
    });

    it('should return 409 when email already exists', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(validAuthDto)
        .expect(409);

      expect(response.body.message).toBe(ERROR_CONSTANT.EMAIL_ALREADY_IN_USE);
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid email format', async () => {
      const invalidDto = {
        email: 'invalid-email',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(invalidDto)
        .expect(400);
    });

    it('should return 400 for missing email', async () => {
      const invalidDto = {
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(invalidDto)
        .expect(400);
    });

    it('should return 400 for missing password', async () => {
      const invalidDto = {
        email: 'test@example.com',
      };

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(invalidDto)
        .expect(400);
    });

    it('should return 400 for empty request body', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({})
        .expect(400);
    });
  });

  describe('/auth/signin (POST)', () => {
    it('should successfully sign in with valid credentials', async () => {
      jest.spyOn(bcryptjs, 'compareSync').mockReturnValue(true);
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send(validAuthDto)
        .expect(201);

      expect(response.body).toHaveProperty(
        'message',
        SUCCESS_CONSTANT.SIGN_IN_SUCCESS,
      );
      expect(response.body).toHaveProperty('accessToken');
      expect(typeof response.body.accessToken).toBe('string');
      expect(response.body.accessToken.length).toBeGreaterThan(0);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: validAuthDto.email },
      });
    });

    it('should return 400 when user does not exist', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send(validAuthDto)
        .expect(400);

      expect(response.body.message).toBe(ERROR_CONSTANT.INVALID_CREDENTIALS);
    });

    it('should return 400 when password is incorrect', async () => {
      jest.spyOn(bcryptjs, 'compareSync').mockReturnValue(false);
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send(validAuthDto)
        .expect(400);

      expect(response.body.message).toBe(ERROR_CONSTANT.INVALID_CREDENTIALS);
    });

    it('should return 400 for invalid email format', async () => {
      const invalidDto = {
        email: 'invalid-email',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/signin')
        .send(invalidDto)
        .expect(400);
    });

    it('should return 400 for missing credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/signin')
        .send({})
        .expect(400);
    });
  });

  describe('/auth/login-session (POST)', () => {
    it('should successfully create session with valid credentials', async () => {
      jest.spyOn(bcryptjs, 'compareSync').mockReturnValue(true);
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .post('/auth/login-session')
        .send(validAuthDto)
        .expect(201);

      expect(response.body).toHaveProperty(
        'message',
        'Session created successfully',
      );
      expect(response.body).toHaveProperty('sessionSet', true);
      expect(response.body).toHaveProperty('originalResult');
      expect(response.body.originalResult).toHaveProperty('accessToken');
    });

    it('should handle authentication failure gracefully', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/auth/login-session')
        .send(validAuthDto)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Login failed');
      expect(response.body).toHaveProperty('sessionSet', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid input', async () => {
      await request(app.getHttpServer())
        .post('/auth/login-session')
        .send({ email: 'invalid-email', password: 'test' })
        .expect(400);
    });
  });

  describe('JWT Token Validation', () => {
    it('should generate a valid JWT token on successful authentication', async () => {
      const hashedPassword = 'hashed-password-123';
      jest.spyOn(bcryptjs, 'hashSync').mockReturnValue(hashedPassword);
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);

      const jwtService = app.get<JwtService>(JwtService);

      const signupResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(validAuthDto)
        .expect(201);

      const token = signupResponse.body.accessToken;
      expect(token).toBeDefined();

      const decodedPayload = jwtService.decode(token);
      expect(decodedPayload).toHaveProperty('sub', mockUser.id);
      expect(decodedPayload).toHaveProperty('email', mockUser.email);
      expect(decodedPayload).toHaveProperty('exp');
      expect(decodedPayload).toHaveProperty('iat');
    });
  });
});
