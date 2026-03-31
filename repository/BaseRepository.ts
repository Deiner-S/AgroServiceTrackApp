import * as SQLite from "expo-sqlite";
import Database from "./dbInit";
import { ColumnDefinition } from "./types";
type OrmModel<T> = {
  table: string;
  schema: Record<string, ColumnDefinition>;
  new (...args: any[]): T;
};

export default abstract class BaseRepository<T> {
  protected db!: SQLite.SQLiteDatabase;
  protected Model: OrmModel<T>;

  protected constructor(Model: OrmModel<T>) {
    this.Model = Model;
  }

  async init() {
    try {
      this.db = await Database.getInstance();
      return this;
    } catch (error) {
      throw error;
    }
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
    return new this.Model(...args);
  }

  // ---------- CRUD ----------
  async getById(id: number | string): Promise<T | null> {
    try {
      const pk = this.primaryKey();

      const row = await this.db.getFirstAsync<any>(
        `SELECT * FROM ${this.Model.table} WHERE ${pk} = ?`,
        [id]
      );
      return row ? this.map(row) : null;
    } catch (error) {
      throw error;
    }
  }

  async getAll(): Promise<T[]> {
    try {
      const rows = await this.db.getAllAsync<any>(
        `SELECT * FROM ${this.Model.table}`
      );
      return rows.map(r => this.map(r));
    } catch (error) {
      throw error;
    }
  }

  async save(entity: T): Promise<boolean> {
    try {
      const allCols = this.columns();
      const cols = allCols.filter(col => {
        const def = this.Model.schema[col];
        return !def.autoIncrement;
      });
      const placeholders = cols.map(() => "?").join(", ");
      const values = cols.map(col => (entity as any)[col]);

      const result = await this.db.runAsync(
        `INSERT INTO ${this.Model.table} (${cols.join(", ")})
         VALUES (${placeholders})`,
        values
      );

      return result.changes > 0;
    } catch (error) {
      throw error;
    }
  }

  async update(entity: T): Promise<boolean> {
    try {
      const pk = this.primaryKey();
      const cols = this.columns().filter(c => c !== pk);
      const set = cols.map(c => `${c} = ?`).join(", ");

      const values = cols.map(c => (entity as any)[c]);
      values.push((entity as any)[pk]);

      const result = await this.db.runAsync(
        `UPDATE ${this.Model.table}
         SET ${set}
         WHERE ${pk} = ?`,
        values
      );

      return result.changes > 0;
    } catch (error) {
      throw error;
    }
  }

  async delete(id: number | string): Promise<boolean> {
    try {
      const pk = this.primaryKey();

      const result = await this.db.runAsync(
        `DELETE FROM ${this.Model.table} WHERE ${pk} = ?`,
        [id]
      );
      return result.changes > 0;
    } catch (error) {
      throw error;
    }
  }
}

