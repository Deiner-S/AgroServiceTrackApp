//listar arquivos e diretorios dentro da pasta onde se armazena os arquivos de banco de dados 
import * as FileSystem from "expo-file-system/legacy";

export async function listarBancos() {
  const sqliteDir = FileSystem.documentDirectory + "SQLite/";

  const info = await FileSystem.getInfoAsync(sqliteDir);
  if (!info.exists) return [];

  console.log(await FileSystem.readDirectoryAsync(sqliteDir));
}


//deletar arquivos da basta onde contem banco de dados
export async function deleteFolderRecursive(path: string) {
  // Garante que tem uma barra no final
  if (!path.endsWith("/")) {
    path = path + "/";
  }

  try {
    // Lista conteúdo da pasta
    const items = await FileSystem.readDirectoryAsync(path);

    // Para cada item encontrado
    for (const item of items) {
      const itemPath = path + item;
      const info = await FileSystem.getInfoAsync(itemPath);

      if (info.isDirectory) {
        // Apaga subpastas recursivamente
        await deleteFolderRecursive(itemPath + "/");
      } else {
        // Apaga arquivos
        await FileSystem.deleteAsync(itemPath, { idempotent: true });
      }
    }

    // Agora que está vazia, apaga a pasta
    await FileSystem.deleteAsync(path, { idempotent: true });

    console.log("Pasta excluída com sucesso:", path);

  } catch (e) {
    console.log("Erro ao excluir pasta:", e);
    throw e;
  }
}