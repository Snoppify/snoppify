import fs from "fs";
import { ObjectWithID, Repository } from "./Repository";

export class JSONRepository<T extends ObjectWithID> implements Repository<T> {
  readonly path: string = "data/json/";

  private name: string;

  private readonly encoding = "utf8";

  protected repo: { [id: string]: T };

  constructor(opts: { name: string; path?: string }) {
    this.name = opts.name;

    if (opts.path) {
      this.path = opts.path;
    }

    this.init();
  }

  private init() {
    const fileContent = fs.readFileSync(this.fullPath(), {
      encoding: this.encoding,
    });

    if (fileContent) {
      this.repo = JSON.parse(fileContent);
    } else {
      this.repo = {};
      this.writeRepoToFile(true);
    }
  }

  private fullPath() {
    return `${this.path + this.name}.json`;
  }

  private writeRepoToFile(synchronous?: false): Promise<void>;
  private writeRepoToFile(synchronous: true): void;
  private writeRepoToFile(synchronous: any): any {
    return (synchronous ? fs.writeFileSync : fs.promises.writeFile)(
      this.fullPath(),
      JSON.stringify(this.repo),
      this.encoding,
    );
  }

  upsave(object: T): Promise<void> {
    this.repo[object.id] = JSON.parse(JSON.stringify(object));
    return this.writeRepoToFile();
  }

  get(id: string): Promise<T> {
    const result = this.repo[id] && JSON.parse(JSON.stringify(this.repo[id]));
    return Promise.resolve(result);
  }

  delete(id: string): Promise<void> {
    delete this.repo[id];
    return this.writeRepoToFile();
  }

  getAll(): Promise<T[]> {
    return Promise.resolve(Object.values(this.repo));
  }
}
