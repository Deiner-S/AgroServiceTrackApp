import {ColumnDefinition} from "@/repository/types"
import { validateCheckListEntity } from "@/utils/validation";


export default class CheckList{
  // 🔹 Nome da tabela derivado automaticamente
  static get table(): string {
    return this.name
      .replace(/[A-Z]/g, l => "_" + l.toLowerCase())
      .replace(/^_/, "");
  }
  // 🔹 Schema da tabela
  static schema: Record<string, ColumnDefinition> = {    
    id: { type: "TEXT", primary: true },
    checklist_item_fk: { type: "TEXT", notNull: true },
    work_order_fk: { type: "TEXT", notNull: true },
    status: { type: "TEXT", notNull: true },
    status_sync: { type: "INTEGER" },
    img_in: { type: "BLOB" },
    img_out: { type: "BLOB" }
  };

  static validate(entity: CheckList): CheckList {
    return validateCheckListEntity(entity);
  }

  constructor(
    public id: string,
    public checklist_item_fk:string,
    public work_order_fk:string,
    public status:string,
    public status_sync?: number,
    public img_in?: Uint8Array | null,
    public img_out?: Uint8Array | null
  ) {}
}
