type MockRunResult = {
  changes: number;
};

type MockDatabase = {
  execAsync: (sql: string) => Promise<void>;
  getAllAsync: <T>(sql: string, params?: unknown[]) => Promise<T[]>;
  getFirstAsync: <T>(sql: string, params?: unknown[]) => Promise<T | null>;
  runAsync: (sql: string, params?: unknown[]) => Promise<MockRunResult>;
};

function createMockDatabase(): MockDatabase {
  return {
    async execAsync(_sql: string) {
      return undefined;
    },
    async getAllAsync<T>(_sql: string, _params?: unknown[]) {
      return [] as T[];
    },
    async getFirstAsync<T>(_sql: string, _params?: unknown[]) {
      return null as T | null;
    },
    async runAsync(_sql: string, _params?: unknown[]) {
      return { changes: 0 };
    },
  };
}

export default class Database {
  private static instance: MockDatabase | null = null;

  private constructor() {}

  static async getInstance(): Promise<MockDatabase> {
    if (!Database.instance) {
      Database.instance = createMockDatabase();
    }

    return Database.instance;
  }
}

export async function initDB(_db: MockDatabase): Promise<void> {
  return undefined;
}
