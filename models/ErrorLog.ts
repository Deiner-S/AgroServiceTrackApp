import { ColumnDefinition } from "@/repository/types";
import { validateErrorLogEntity } from "@/utils/validation";

export default class ErrorLog {
  static get table(): string {
    return this.name
      .replace(/[A-Z]/g, l => "_" + l.toLowerCase())
      .replace(/^_/, "");
  }

  static schema: Record<string, ColumnDefinition> = {
    id: { type: "TEXT", primary: true },
    osVersion: { type: "TEXT", notNull: true },
    deviceModel: { type: "TEXT", notNull: true },
    user: { type: "TEXT", notNull: true },
    erro: { type: "TEXT", notNull: true },
    stacktrace: { type: "TEXT" },
    horario: { type: "TEXT", notNull: true },
    status_sync: { type: "INTEGER", notNull: true, default: 0 },
  };

  static validate(entity: ErrorLog): ErrorLog {
    return validateErrorLogEntity(entity);
  }

  constructor(
    public id: string,
    public osVersion: string,
    public deviceModel: string,
    public user: string,
    public erro: string,
    public stacktrace: string | null,
    public horario: string,
    public status_sync: number,
  ) {}
}
