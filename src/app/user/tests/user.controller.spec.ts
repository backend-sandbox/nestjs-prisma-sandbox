import { Test } from '@nestjs/testing';
import { CurrentUserData } from '../../../common/types/user.types';
import { UserController } from '../controllers';
import { UserService } from '../services';

const mockUser = {
  id: 'uuid',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
};

const mockUserService = {
  getMe: jest.fn().mockReturnValue(mockUser),
  getUserById: jest.fn().mockImplementation((id: string) => ({
    ...mockUser,
    id,
  })),
};

describe('UserController', () => {
  let userController: UserController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    userController = moduleRef.get(UserController);
  });

  afterEach(() => {
    jest.clearAllMocks(); // * clear mocks after each test
  });

  describe('getMe', () => {
    it('should return the current user', async () => {
      const user: CurrentUserData = {
        id: 'uuid',
        email: mockUser.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = (await userController.getMe(user)) as typeof mockUser;

      expect(result).toEqual(mockUser);
      expect(mockUserService.getMe).toHaveBeenCalledWith(user);
      expect(mockUserService.getMe).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserById', () => {
    it('should return a user by id', async () => {
      const userId = '1234';
      const result = await userController.getUserById(userId);

      expect(result).toEqual({ ...mockUser, id: userId });
      expect(mockUserService.getUserById).toHaveBeenCalledWith(userId);
      expect(mockUserService.getUserById).toHaveBeenCalledTimes(1);
    });
  });
});
