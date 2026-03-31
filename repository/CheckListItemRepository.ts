import CheckListItem from "@/models/CheckListItem";
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
    try {
      const result = await this.db.runAsync(
        `DELETE FROM ${this.Model.table}`
      );
      return result.changes > 0;
    } catch (error) {
      throw error;
    }
  }
}
