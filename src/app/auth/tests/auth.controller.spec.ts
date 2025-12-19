/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { SUCCESS_CONSTANT } from '../../../common/constants';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { AuthDto } from '../dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthDto: AuthDto = {
    email: 'test@example.com',
    password: 'password123',
  };

  const mockSignupResponse = {
    message: SUCCESS_CONSTANT.SIGN_UP_SUCCESS,
    accessToken: 'mock-jwt-token-signup',
  };

  const mockSigninResponse = {
    message: SUCCESS_CONSTANT.SIGN_IN_SUCCESS,
    accessToken: 'mock-jwt-token-signin',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signup: jest.fn(),
            signin: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should call authService.signup and return the result', async () => {
      authService.signup.mockResolvedValue(mockSignupResponse);

      const result = await controller.signup(mockAuthDto);

      expect(authService.signup).toHaveBeenCalledWith(mockAuthDto);
      expect(authService.signup).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSignupResponse);
    });

    it('should propagate errors from authService.signup', async () => {
      const error = new Error('Signup failed');
      authService.signup.mockRejectedValue(error);

      await expect(controller.signup(mockAuthDto)).rejects.toThrow(error);
      expect(authService.signup).toHaveBeenCalledWith(mockAuthDto);
      expect(authService.signup).toHaveBeenCalledTimes(1);
    });
  });

  describe('signin', () => {
    it('should call authService.signin and return the result', async () => {
      authService.signin.mockResolvedValue(mockSigninResponse);

      const result = await controller.signin(mockAuthDto);

      expect(authService.signin).toHaveBeenCalledWith(mockAuthDto);
      expect(authService.signin).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSigninResponse);
    });

    it('should propagate errors from authService.signin', async () => {
      const error = new Error('Signin failed');
      authService.signin.mockRejectedValue(error);

      await expect(controller.signin(mockAuthDto)).rejects.toThrow(error);
      expect(authService.signin).toHaveBeenCalledWith(mockAuthDto);
      expect(authService.signin).toHaveBeenCalledTimes(1);
    });
  });

  describe('loginWithSession', () => {
    it('should successfully create a session when signin is successful', async () => {
      const mockSession = { userId: undefined };
      authService.signin.mockResolvedValue(mockSigninResponse);

      const result = await controller.loginWithSession(
        mockAuthDto,
        mockSession,
      );

      expect(authService.signin).toHaveBeenCalledWith(mockAuthDto);
      expect(authService.signin).toHaveBeenCalledTimes(1);
      expect(mockSession.userId).toBe('demo-user-id');
      expect(result).toEqual({
        message: 'Session created successfully',
        sessionSet: true,
        originalResult: mockSigninResponse,
      });
    });

    it('should handle the case when session object is undefined', async () => {
      authService.signin.mockResolvedValue(mockSigninResponse);

      const result = await controller.loginWithSession(mockAuthDto, undefined);

      expect(authService.signin).toHaveBeenCalledWith(mockAuthDto);
      expect(authService.signin).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        message: 'Session created successfully',
        sessionSet: true,
        originalResult: mockSigninResponse,
      });
    });

    it('should return failure message when signin result does not contain accessToken', async () => {
      const mockSession = { userId: undefined };
      const invalidResponse = {
        message: 'Some message',
        // * missing accessToken property
      };
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Intentionally testing invalid response type
      authService.signin.mockResolvedValue(invalidResponse);

      const result = await controller.loginWithSession(
        mockAuthDto,
        mockSession,
      );

      expect(authService.signin).toHaveBeenCalledWith(mockAuthDto);
      expect(authService.signin).toHaveBeenCalledTimes(1);
      expect(mockSession.userId).toBeUndefined();
      expect(result).toEqual({
        message: 'Login failed',
        sessionSet: false,
      });
    });

    it('should handle errors from authService.signin gracefully', async () => {
      const mockSession = { userId: undefined };
      const error = new Error('Authentication failed');
      authService.signin.mockRejectedValue(error);

      const result = await controller.loginWithSession(
        mockAuthDto,
        mockSession,
      );

      expect(authService.signin).toHaveBeenCalledWith(mockAuthDto);
      expect(authService.signin).toHaveBeenCalledTimes(1);
      expect(mockSession.userId).toBeUndefined();
      expect(result).toEqual({
        message: 'Login failed',
        error: 'Authentication failed',
        sessionSet: false,
      });
    });

    it('should handle unknown errors gracefully', async () => {
      const mockSession = { userId: undefined };
      authService.signin.mockRejectedValue('string error');

      const result = await controller.loginWithSession(
        mockAuthDto,
        mockSession,
      );

      expect(authService.signin).toHaveBeenCalledWith(mockAuthDto);
      expect(authService.signin).toHaveBeenCalledTimes(1);
      expect(mockSession.userId).toBeUndefined();
      expect(result).toEqual({
        message: 'Login failed',
        error: 'Unknown error',
        sessionSet: false,
      });
    });
  });
});
