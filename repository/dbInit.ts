import CheckList from "@/models/CheckList";
import CheckListItem from "@/models/CheckListItem";
import ErrorLog from "@/models/ErrorLog";
import WorkOrder from "@/models/WorkOrder";
import { getErrorMessage } from "@/exceptions/ExceptionHandler";
import RepositoryException from "@/exceptions/RepositoryException";
import * as any from "expo-sqlite";

const models = [
  WorkOrder,
  CheckList,
  CheckListItem,
  ErrorLog,
];

// Singleton: garante que so exista uma instancia do banco de dados.
export default class Database {
  private static instance: any | null = null;
  private static initPromise: Promise<any> | null = null;

  private constructor() {}

  static async getInstance(): Promise<any> {
    if (Database.instance) {
      return Database.instance;
    }

    if (!Database.initPromise) {
      Database.initPromise = (async () => {
        try {
          const db = await any.openDatabaseAsync("app.db");
          await initDB(db);
          Database.instance = db;
          return db;
        } catch (error) {
          throw error instanceof RepositoryException
            ? error
            : new RepositoryException(getErrorMessage(error), error);
        }
      })().catch((error) => {
        Database.initPromise = null;
        throw error;
      });
    }

    return Database.initPromise;
  }
}

function generateCreateTableSQL(model: any): string {
  const columns = Object.entries(model.schema).map(([name, def]: any) => {
    let column = `${name} ${def.type}`;

    if (def.primary) column += " PRIMARY KEY";
    if (def.notNull) column += " NOT NULL";
    if (def.unique) column += " UNIQUE";
    if (def.default !== undefined) column += ` DEFAULT ${def.default}`;

    return column;
  });

  return `
    CREATE TABLE IF NOT EXISTS ${model.table} (
      ${columns.join(", ")}
    );
  `;
}

export async function initDB(db: any): Promise<void> {
  let transactionStarted = false;

  try {
    await db.execAsync("BEGIN TRANSACTION");
    transactionStarted = true;

    for (const model of models) {
      const sql = generateCreateTableSQL(model);
      await db.execAsync(sql);
    }

    await db.execAsync("COMMIT");
    transactionStarted = false;
  } catch (error) {
    if (transactionStarted) {
      try {
        await db.execAsync("ROLLBACK");
      } catch {
        // Se a transacao ja tiver sido encerrada, preservamos o erro original.
      }
    }

    console.error("Erro ao inicializar banco:", error);
    throw error instanceof RepositoryException
      ? error
      : new RepositoryException(getErrorMessage(error), error);
  }
}
