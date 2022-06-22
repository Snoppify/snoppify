import fs from "fs";
import { ObjectWithID, Repository } from "./Repository";

export class JSONRepository<T extends ObjectWithID> implements Repository<T> {
  readonly path: string = "data/json/";

  private name: string;

  private readonly encoding = "utf8";

  private ModelClass: { new (...args): T };

  private pathExists = false;

  protected store: { [id: string]: T };

  constructor(opts: {
    name: string;
    path?: string;
    modelClass?: { new (data: T): T };
  }) {
    this.name = opts.name;
    this.ModelClass = opts.modelClass;

    if (opts.path) {
      this.path = opts.path;
    }

    this.init();
  }

  private init() {
    try {
      const fileContent = fs.readFileSync(this.fullPath(), {
        encoding: this.encoding,
      });
      this.store = JSON.parse(fileContent);
      this.pathExists = true;
    } catch (error) {
      this.store = {};
      this.writeRepoToFile(true);
    }
  }

  private writeRepoToFile(synchronous?: false): Promise<void>;
  private writeRepoToFile(synchronous: true): void;
  private writeRepoToFile(synchronous: any): any {
    this.createDirectoryAtPath();

    return (synchronous ? fs.writeFileSync : fs.promises.writeFile)(
      this.fullPath(),
      JSON.stringify(this.store),
      this.encoding,
    );
  }

  private createDirectoryAtPath() {
    if (!this.pathExists) {
      fs.mkdirSync(this.path, { recursive: true });
    }
  }

  private fullPath() {
    return `${this.path + this.name}.json`;
  }

  upsave(object: T): Promise<void> {
    this.store[object.id] = JSON.parse(JSON.stringify(object));
    return this.writeRepoToFile();
  }

  get(id: string): Promise<T> {
    const result = this.store[id] && JSON.parse(JSON.stringify(this.store[id]));
    const instance = this.instantiateObject(result);
    return Promise.resolve(instance);
  }

  private instantiateObject(obj: T) {
    return this.ModelClass ? new this.ModelClass(obj) : obj;
  }

  delete(id: string): Promise<void> {
    delete this.store[id];
    return this.writeRepoToFile();
  }

  getAll(): Promise<T[]> {
    return Promise.resolve(
      Object.values(this.store).map((o) => this.instantiateObject(o)),
    );
  }
}
