import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshDTO, SignInDTO } from './DTO/sign-in.dto';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  // Mock the AuthService
  const mockAuthService = {
    signIn: jest.fn(),
    refreshTokens: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signIn', () => {
    it('should return user and tokens on success', async () => {
      const signInDto: SignInDTO = {
        wallet: '0x123',
        nonce: 'some-nonce',
        signature: 'valid-signature',
      };

      const mockResponse = {
        user: { wallet: signInDto.wallet },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      };

      // Mock the service method to return the mock response
      mockAuthService.signIn.mockResolvedValue(mockResponse);

      const result = await controller.signIn(signInDto);

      expect(result).toEqual(mockResponse);
      expect(authService.signIn).toHaveBeenCalledWith(signInDto);
    });

    it('should throw BadRequestException if wallet addresses do not match', async () => {
      const signInDto: SignInDTO = {
        wallet: '0x123',
        nonce: 'some-nonce',
        signature: 'invalid-signature',
      };

      // Simulate the error from service
      mockAuthService.signIn.mockRejectedValue(
        new BadRequestException("Wallet addresses doesn't match"),
      );

      await expect(controller.signIn(signInDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if nonce is invalid', async () => {
      const signInDto: SignInDTO = {
        wallet: '0x123',
        nonce: 'invalid-nonce',
        signature: 'valid-signature',
      };

      // Simulate the error from service
      mockAuthService.signIn.mockRejectedValue(
        new BadRequestException('Nonce mismatch'),
      );

      await expect(controller.signIn(signInDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('refresh', () => {
    it('should return new pair of jwt tokens on success', async () => {
      const refreshDTO: RefreshDTO = {
        wallet: '0x123',
        refreshToken: 'refresh-token',
      };

      const mockResponse = {
        tokens: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      };

      // Mock the service method to return the mock response
      mockAuthService.refreshTokens.mockResolvedValue(mockResponse);

      const result = await controller.refresh(refreshDTO);

      expect(result).toEqual(mockResponse);
      expect(authService.refreshTokens).toHaveBeenCalledWith(refreshDTO);
    });

    it('should throw ForbiddenException if refresh token was expired', async () => {
      const refreshDTO: RefreshDTO = {
        wallet: '0x123',
        refreshToken: 'expired-refresh-token',
      };

      // Simulate the error from service
      mockAuthService.refreshTokens.mockImplementation(async () => {
        throw new ForbiddenException('Refresh token has expired.');
      });

      await expect(controller.refresh(refreshDTO)).rejects.toThrow(
        new ForbiddenException('Refresh token has expired.'),
      );
    });
  });
});
