import RepositoryException from '@/exceptions/RepositoryException';
import BaseRepository from '@/repository/BaseRepository';
import Database from '@/repository/dbInit';

jest.mock('@/repository/dbInit', () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(),
  },
}));

class TestModel {
  static table = 'test_model';
  static schema = {
    id: { type: 'TEXT', primary: true },
    name: { type: 'TEXT' },
  };

  constructor(
    public id: string,
    public name: string
  ) {}
}

class TestRepository extends BaseRepository<TestModel> {
  constructor() {
    super(TestModel as any);
  }
}

describe('BaseRepository', () => {
  const mockGetInstance = Database.getInstance as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('wraps init errors as RepositoryException', async () => {
    mockGetInstance.mockRejectedValue(new Error('db unavailable'));
    const repository = new TestRepository();

    await expect(repository.init()).rejects.toBeInstanceOf(RepositoryException);
  });

  it('maps rows returned from getAll', async () => {
    const db = {
      getAllAsync: jest.fn().mockResolvedValue([{ id: '1', name: 'item' }]),
    };
    mockGetInstance.mockResolvedValue(db);
    const repository = await new TestRepository().init();

    await expect(repository.getAll()).resolves.toEqual([new TestModel('1', 'item')]);
  });

  it('wraps query errors as RepositoryException', async () => {
    const db = {
      getAllAsync: jest.fn().mockRejectedValue(new Error('query failed')),
    };
    mockGetInstance.mockResolvedValue(db);
    const repository = await new TestRepository().init();

    await expect(repository.getAll()).rejects.toBeInstanceOf(RepositoryException);
  });
});
