import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: { sign: jest.Mock };

  beforeEach(() => {
    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
    };

    service = new AuthService({} as any, jwtService as any);
  });

  describe('login', () => {
    it('inclui a role no payload do token JWT', async () => {
      const result = await service.login({
        id: 'employee-id',
        email: 'admin@conecta.com',
        name: 'Admin',
        surname: 'Root',
        role: 'ADMIN',
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'employee-id',
        email: 'admin@conecta.com',
        name: 'Admin',
        surname: 'Root',
        role: 'ADMIN',
      });
      expect(result).toEqual({ access_token: 'signed-token' });
    });
  });
});
