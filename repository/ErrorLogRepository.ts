import ErrorLog from "@/models/ErrorLog";
import BaseRepository from "./BaseRepository";

export default class ErrorLogRepository extends BaseRepository<ErrorLog> {
  constructor() {
    super(ErrorLog);
  }

  static async build() {
    const repo = new ErrorLogRepository();
    return repo.init();
  }
}
