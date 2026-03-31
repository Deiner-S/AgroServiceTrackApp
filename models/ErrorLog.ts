import { ColumnDefinition } from "@/repository/types";

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
  };

  constructor(
    public id: string,
    public osVersion: string,
    public deviceModel: string,
    public user: string,
    public erro: string,
    public stacktrace: string | null,
    public horario: string,
  ) {}
}
