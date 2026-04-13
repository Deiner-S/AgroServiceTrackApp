import {
  exceptionHandling,
} from "@/exceptions/ExceptionHandler";
import RepositoryException from "@/exceptions/RepositoryException";
import Database from "./dbInit";
import { ColumnDefinition } from "./types";

type RepositoryDatabase = Awaited<ReturnType<typeof Database.getInstance>>;

type OrmModel<T> = {
  table: string;
  schema: Record<string, ColumnDefinition>;
  validate?: (entity: T) => T;
  new (...args: any[]): T;
};

export default abstract class BaseRepository<T> {
  protected db!: RepositoryDatabase;
  protected Model: OrmModel<T>;

  protected constructor(Model: OrmModel<T>) {
    this.Model = Model;
  }

  async init() {
    return exceptionHandling(async () => {
      this.db = await Database.getInstance();
      return this;
    }, { ExceptionType: RepositoryException });
  }

  protected primaryKey(): string {
    const entry = Object.entries(this.Model.schema).find(
      ([, def]) => def.primary
    );

    if (!entry) {
      throw new Error(`Primary key not defined for table ${this.Model.table}`);
    }

    return entry[0];
  }

  protected columns() {
    return Object.keys(this.Model.schema);
  }

  protected map(row: any): T {
    const args = this.columns().map((column) => row[column]);
    const entity = new this.Model(...args);
    return this.Model.validate ? this.Model.validate(entity) : entity;
  }

  async getById(id: number | string): Promise<T | null> {
    return exceptionHandling(async () => {
      const pk = this.primaryKey();

      const row = await this.db.getFirstAsync<any>(
        `SELECT * FROM ${this.Model.table} WHERE ${pk} = ?`,
        [id]
      );

      return row ? this.map(row) : null;
    }, { ExceptionType: RepositoryException });
  }

  async getAll(): Promise<T[]> {
    return exceptionHandling(async () => {
      const rows = await this.db.getAllAsync<any>(
        `SELECT * FROM ${this.Model.table}`
      );
      return rows.map((row) => this.map(row));
    }, { ExceptionType: RepositoryException, fallbackValue: [] });
  }

  async save(entity: T): Promise<boolean> {
    return exceptionHandling(async () => {
      const validatedEntity = this.Model.validate ? this.Model.validate(entity) : entity;
      const allCols = this.columns();
      const cols = allCols.filter((col) => !this.Model.schema[col].autoIncrement);
      const placeholders = cols.map(() => "?").join(", ");
      const values = cols.map((col) => (validatedEntity as any)[col]);

      const result = await this.db.runAsync(
        `INSERT INTO ${this.Model.table} (${cols.join(", ")})
         VALUES (${placeholders})`,
        values
      );

      return result.changes > 0;
    }, { ExceptionType: RepositoryException, fallbackValue: false });
  }

  async update(entity: T): Promise<boolean> {
    return exceptionHandling(async () => {
      const validatedEntity = this.Model.validate ? this.Model.validate(entity) : entity;
      const pk = this.primaryKey();
      const cols = this.columns().filter((column) => column !== pk);
      const set = cols.map((column) => `${column} = ?`).join(", ");

      const values = cols.map((column) => (validatedEntity as any)[column]);
      values.push((validatedEntity as any)[pk]);

      const result = await this.db.runAsync(
        `UPDATE ${this.Model.table}
         SET ${set}
         WHERE ${pk} = ?`,
        values
      );

      return result.changes > 0;
    }, { ExceptionType: RepositoryException, fallbackValue: false });
  }

  async delete(id: number | string): Promise<boolean> {
    return exceptionHandling(async () => {
      const pk = this.primaryKey();

      const result = await this.db.runAsync(
        `DELETE FROM ${this.Model.table} WHERE ${pk} = ?`,
        [id]
      );

      return result.changes > 0;
    }, { ExceptionType: RepositoryException, fallbackValue: false });
  }
}
