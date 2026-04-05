import * as SQLite from "expo-sqlite";
import {
  exceptionHandling,
} from "@/exceptions/ExceptionHandler";
import RepositoryException from "@/exceptions/RepositoryException";
import Database from "./dbInit";
import { ColumnDefinition } from "./types";
type OrmModel<T> = {
  table: string;
  schema: Record<string, ColumnDefinition>;
  validate?: (entity: T) => T;
  new (...args: any[]): T;
};

export default abstract class BaseRepository<T> {
  protected db!: SQLite.SQLiteDatabase;
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

  // ---------- helpers ----------
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

  protected values(entity: Partial<T>) {
    return this.columns().map(col => (entity as any)[col]);
  }

  protected map(row: any): T {
    const args = this.columns().map(c => row[c]);
    const entity = new this.Model(...args);
    return this.Model.validate ? this.Model.validate(entity) : entity;
  }

  // ---------- CRUD ----------
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
      return rows.map(r => this.map(r));
    }, { ExceptionType: RepositoryException });
  }

  async save(entity: T): Promise<boolean> {
    return exceptionHandling(async () => {
      const validatedEntity = this.Model.validate ? this.Model.validate(entity) : entity;
      const allCols = this.columns();
      const cols = allCols.filter(col => {
        const def = this.Model.schema[col];
        return !def.autoIncrement;
      });
      const placeholders = cols.map(() => "?").join(", ");
      const values = cols.map(col => (validatedEntity as any)[col]);

      const result = await this.db.runAsync(
        `INSERT INTO ${this.Model.table} (${cols.join(", ")})
         VALUES (${placeholders})`,
        values
      );

      return result.changes > 0;
    }, { ExceptionType: RepositoryException });
  }

  async update(entity: T): Promise<boolean> {
    return exceptionHandling(async () => {
      const validatedEntity = this.Model.validate ? this.Model.validate(entity) : entity;
      const pk = this.primaryKey();
      const cols = this.columns().filter(c => c !== pk);
      const set = cols.map(c => `${c} = ?`).join(", ");

      const values = cols.map(c => (validatedEntity as any)[c]);
      values.push((validatedEntity as any)[pk]);

      const result = await this.db.runAsync(
        `UPDATE ${this.Model.table}
         SET ${set}
         WHERE ${pk} = ?`,
        values
      );

      return result.changes > 0;
    }, { ExceptionType: RepositoryException });
  }

  async delete(id: number | string): Promise<boolean> {
    return exceptionHandling(async () => {
      const pk = this.primaryKey();

      const result = await this.db.runAsync(
        `DELETE FROM ${this.Model.table} WHERE ${pk} = ?`,
        [id]
      );
      return result.changes > 0;
    }, { ExceptionType: RepositoryException });
  }
}

