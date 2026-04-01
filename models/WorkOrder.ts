import { ColumnDefinition } from "@/repository/types";
import { validateWorkOrderEntity } from "@/utils/validation";

export default class WorkOrder{
  // 🔹 Nome da tabela derivado automaticamente
  static get table(): string {
    return this.name
      .replace(/[A-Z]/g, l => "_" + l.toLowerCase())
      .replace(/^_/, "");
  }
  // 🔹 Schema da tabela
  static schema: Record<string, ColumnDefinition> = {
    operation_code: { type: "TEXT", primary: true },
    client: { type: "TEXT", notNull: true },
    symptoms: { type: "TEXT", notNull: true },
    chassi: { type: "TEXT" },
    horimetro: { type: "REAL" },
    model: { type: "TEXT" },
    date_in: { type: "TEXT" },
    date_out: { type: "TEXT" },
    status: { type: "TEXT", notNull: true },
    status_sync: { type: "INTEGER", notNull: true },
    service: { type: "TEXT" },
    signature_in: { type: "BLOB" },
    signature_out: { type: "BLOB" },
    insertDate: { type: "TEXT" }
  };

  static validate(entity: WorkOrder): WorkOrder {
    return validateWorkOrderEntity(entity);
  }

  constructor(
    public operation_code: string,
    public client: string,
    public symptoms: string,
    public chassi: string | undefined,
    public horimetro: number | undefined,
    public model: string | undefined,
    public date_in: string | undefined,
    public date_out: string | undefined,
    public status: string,
    public status_sync: number,
    public service?: string,
    public signature_in?: Uint8Array | null,
    public signature_out?: Uint8Array | null,
    public insertDate?: string,
  ) {}
}
