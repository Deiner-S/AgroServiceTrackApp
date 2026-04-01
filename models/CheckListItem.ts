import { ColumnDefinition } from "@/repository/types";
import { validateCheckListItemEntity } from "@/utils/validation";

export default class CheckListItem {
  // 🔹 Nome da tabela derivado automaticamente
  static get table(): string {
    return this.name
      .replace(/[A-Z]/g, l => "_" + l.toLowerCase())
      .replace(/^_/, "");
  }
  // 🔹 Schema da tabela
  static schema: Record<string, ColumnDefinition> = {
    id: { type: "TEXT", primary: true },
    name: { type: "TEXT", notNull: true },
    status: {type: "INTEGER",notNull: true, default:0}
  };

  static validate(entity: CheckListItem): CheckListItem {
    return validateCheckListItemEntity(entity);
  }
  constructor(
    public id: string,
    public name: string,
    public status: number
  ) {}
}
