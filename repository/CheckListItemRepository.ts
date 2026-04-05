import CheckListItem from "@/models/CheckListItem";
import { exceptionHandling } from "@/exceptions/ExceptionHandler";
import RepositoryException from "@/exceptions/RepositoryException";
import BaseRepository from "./BaseRepository";
export default class CheckListItemRepository extends BaseRepository<CheckListItem> {

  
  constructor() {
    super(CheckListItem); // passa a classe
  }

  static async build() {
    const repo = new CheckListItemRepository();
    return repo.init();
  }
  async deleteAll(){
    return exceptionHandling(async () => {
      const result = await this.db.runAsync(
        `DELETE FROM ${this.Model.table}`
      );
      return result.changes > 0;
    }, { ExceptionType: RepositoryException });
  }
}
