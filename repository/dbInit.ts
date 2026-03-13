import CheckList from "@/models/CheckList";
import CheckListItem from "@/models/CheckListItem";
import WorkOrder from "@/models/WorkOrder";
import * as any from "expo-sqlite";

const models = [
  WorkOrder,
  CheckList,
  CheckListItem,

]
//Singleton: garante que só exista uma instância do banco de dados
export default class Database {
  private static instance: any | null = null;

  private constructor() {} // impede instância direta

  static async getInstance(): Promise<any> {
    if (!Database.instance) {
      const db = await any.openDatabaseAsync("app.db");
      await initDB(db);
      Database.instance = db;      
    }    
    return Database.instance;
  }
}

// 🔹 Gera SQL automaticamente
function generateCreateTableSQL(model: any): string {
  const columns = Object.entries(model.schema).map(([name, def]: any) => {
    let column = `${name} ${def.type}`

    if (def.primary) column += " PRIMARY KEY"
    if (def.notNull) column += " NOT NULL"
    if (def.unique) column += " UNIQUE"
    if (def.default !== undefined) column += ` DEFAULT ${def.default}`

    return column
  })

  return `
    CREATE TABLE IF NOT EXISTS ${model.table} (
      ${columns.join(", ")}
    );
  `
}

// 🔹 Inicialização totalmente async
export async function initDB(db: any): Promise<void> {
  try {
    await db.execAsync("BEGIN TRANSACTION")
    await db.execAsync(`
        DROP TABLE IF EXISTS check_list_item;
        DROP TABLE IF EXISTS work_order;
        DROP TABLE IF EXISTS check_list;`
    )
    for (const model of models) {
      const sql = generateCreateTableSQL(model)
      await db.execAsync(sql)
    }

    await db.execAsync("COMMIT")
  } catch (error) {
    await db.execAsync("ROLLBACK")
    console.error("Erro ao inicializar banco:", error)
    throw error
  }
}



