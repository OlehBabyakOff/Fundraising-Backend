import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { RedisProvider } from 'src/providers/cache/redis.provider';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  // Mock RedisProvider and UserService
  const mockRedisProvider = {
    getCachedValue: jest.fn().mockResolvedValue('mocked-nonce'),
    buildCacheKey: jest.fn().mockReturnValue('mocked-key'),
    hashIdentifiers: jest.fn().mockReturnValue('mocked-hash'),
  };

  const mockUserService = {
    generateNonce: jest.fn().mockResolvedValue('mocked-nonce'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: RedisProvider, useValue: mockRedisProvider },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should generate nonce successfully', async () => {
    const wallet = 'test-wallet';
    const response = await controller.generateNonce({ wallet });

    expect(response).toEqual({ nonce: 'mocked-nonce' });

    expect(userService.generateNonce).toHaveBeenCalledWith(wallet);
  });
});
