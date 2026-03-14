import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User, RiotAccount } from './entities';
import { RiotService } from '@/modules/riot/riot.service';

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-abc123',
    username: 'spartantecno_039212',
    email: 'test@example.com',
    balance: 10,
    hasRiotAccount: false,
    isActive: true,
    ...overrides,
  }) as User;

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Pick<Repository<User>, 'findOne' | 'update' | 'createQueryBuilder'>>;
  let riotAccountRepository: jest.Mocked<Pick<Repository<RiotAccount>, 'findOne'>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn().mockResolvedValue({ affected: 1 }),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RiotAccount),
          useValue: {
            findOne: jest.fn(),
            delete: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: RiotService,
          useValue: {
            getAccountByRiotId: jest.fn(),
            getSummonerByPuuid: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn((cb: (m: unknown) => Promise<unknown>) =>
              cb({
                getRepository: jest.fn().mockReturnValue({
                  delete: jest.fn(),
                  save: jest.fn(),
                  update: jest.fn(),
                  create: jest.fn((data: unknown) => data),
                }),
              }),
            ),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    riotAccountRepository = module.get(getRepositoryToken(RiotAccount));
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // updateUsername
  // ─────────────────────────────────────────────────────────────────────────────
  describe('updateUsername', () => {
    it('actualiza el nombre exitosamente cuando está disponible', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValueOnce(null); // not taken
      await service.updateUsername('user-abc123', 'prueb_war');
      expect(userRepository.update).toHaveBeenCalledWith('user-abc123', { username: 'prueb_war' });
    });

    it('permite reutilizar el propio nombre de usuario (mismo userId)', async () => {
      const self = makeUser({ id: 'user-abc123', username: 'prueb_war' });
      (userRepository.findOne as jest.Mock).mockResolvedValueOnce(self);
      await service.updateUsername('user-abc123', 'prueb_war');
      expect(userRepository.update).toHaveBeenCalledWith('user-abc123', { username: 'prueb_war' });
    });

    it('lanza ConflictException cuando el nombre ya lo tiene otro usuario', async () => {
      const other = makeUser({ id: 'user-other', username: 'prueb_war' });
      (userRepository.findOne as jest.Mock).mockResolvedValueOnce(other);
      await expect(service.updateUsername('user-abc123', 'prueb_war')).rejects.toThrow(
        ConflictException,
      );
    });

    it('lanza BadRequestException con formato inválido — muy corto', async () => {
      await expect(service.updateUsername('user-abc123', 'ab')).rejects.toThrow(
        BadRequestException,
      );
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('lanza BadRequestException con formato inválido — caracteres especiales', async () => {
      await expect(service.updateUsername('user-abc123', 'nombre malo!')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lanza BadRequestException con formato inválido — demasiado largo (>20)', async () => {
      await expect(
        service.updateUsername('user-abc123', 'a'.repeat(21)),
      ).rejects.toThrow(BadRequestException);
    });

    it('acepta username con guión bajo y números (formato válido)', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValueOnce(null);
      await expect(
        service.updateUsername('user-abc123', 'Shadow_King99'),
      ).resolves.not.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // checkUsernameAvailability
  // ─────────────────────────────────────────────────────────────────────────────
  describe('checkUsernameAvailability', () => {
    it('retorna available:true cuando no existe ningún usuario con ese nombre', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValueOnce(null);
      const result = await service.checkUsernameAvailability('prueb_war', 'user-abc123');
      expect(result).toEqual({ available: true });
    });

    it('retorna available:false cuando otro usuario ya tiene ese nombre', async () => {
      const other = makeUser({ id: 'user-other', username: 'prueb_war' });
      (userRepository.findOne as jest.Mock).mockResolvedValueOnce(other);
      const result = await service.checkUsernameAvailability('prueb_war', 'user-abc123');
      expect(result).toEqual({ available: false });
    });

    it('retorna available:true cuando el nombre ya pertenece al propio usuario', async () => {
      const self = makeUser({ id: 'user-abc123', username: 'prueb_war' });
      (userRepository.findOne as jest.Mock).mockResolvedValueOnce(self);
      const result = await service.checkUsernameAvailability('prueb_war', 'user-abc123');
      expect(result).toEqual({ available: true });
    });

    it('retorna available:false para un nombre con formato inválido', async () => {
      const result = await service.checkUsernameAvailability('ab', 'user-abc123');
      expect(result).toEqual({ available: false });
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('retorna available:false para un nombre vacío', async () => {
      const result = await service.checkUsernameAvailability('', 'user-abc123');
      expect(result).toEqual({ available: false });
    });

    it('retorna available:false para caracteres inválidos', async () => {
      const result = await service.checkUsernameAvailability('nombre malo!', 'user-abc123');
      expect(result).toEqual({ available: false });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // findById
  // ─────────────────────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('retorna el usuario con su riotAccount cuando existe', async () => {
      const user = makeUser();
      (userRepository.findOne as jest.Mock).mockResolvedValueOnce(user);
      const result = await service.findById('user-abc123');
      expect(result).toEqual(user);
    });

    it('lanza NotFoundException cuando el usuario no existe', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValueOnce(null);
      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
