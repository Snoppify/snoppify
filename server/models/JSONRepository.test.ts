import fs from "fs";
import { JSONRepository } from "./JSONRepository";
import { ObjectWithID } from "./Repository";

jest.mock("fs", () => ({
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  promises: {
    readFile: jest.fn(() => Promise.resolve({})),
    writeFile: jest.fn(() => Promise.resolve()),
  },
}));

class TestModelImpl implements TestModel {
  a: string;

  b: number;

  id: string;

  constructor(props: Partial<TestModel>) {
    Object.assign(this, props);
  }

  getA() {
    return this.a;
  }
}

describe("JSONRepository", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("creates a repository with a specified name", () => {
    const repo = createTestRepo();
    expect(repo.path).toBe("data/json/");
  });

  it("creates a repo with custom path", () => {
    const repo = new JSONRepository<any>({
      name: "test",
      path: "custom/path/",
    });
    expect(repo.path).toBe("custom/path/");
  });

  it("creates a new json file if needed when created", () => {
    mockImplementation(fs.readFileSync, () => {
      throw new Error("ENOENT: no such file or directory");
    });

    // eslint-disable-next-line no-new
    new JSONRepository<TestModel>({
      name: "TestModel",
      path: "custom/path/",
    });

    expect(fs.mkdirSync).toBeCalledWith("custom/path/", {
      recursive: true,
    });

    expect(fs.writeFileSync).toBeCalledWith(
      "custom/path/TestModel.json",
      JSON.stringify({}),
      "utf8",
    );
  });

  it("reads from existing file when created", () => {
    // eslint-disable-next-line no-new
    new JSONRepository<TestModel>({
      name: "TestModel",
      path: "custom/path/",
    });

    expect(fs.readFileSync).toBeCalledWith("custom/path/TestModel.json", {
      encoding: "utf8",
    });
  });

  it("doesn't write new file on creation if file exists", () => {
    mockImplementation(fs.readFileSync, () => {
      return "{}";
    });

    createTestRepo();

    expect(fs.writeFileSync).not.toBeCalled();
  });

  it("gets objects correctly", async () => {
    const storeContent = { TEST_ID: { id: "TEST_ID", a: "a", b: 1 } };

    mockImplementation(fs.readFileSync, () => {
      return JSON.stringify(storeContent);
    });

    const repo = createTestRepo();

    const obj = await repo.get("TEST_ID");
    expect(obj).toEqual<TestModel>(storeContent.TEST_ID);
  });

  it("upsaves correctly", async () => {
    const repo = createTestRepo();
    const testObject = { id: "ID1", a: "test", b: 2 };

    expect(await repo.get(testObject.id)).toBe(undefined);

    await repo.upsave(testObject);
    const result = await repo.get(testObject.id);

    expect(result).toEqual(testObject);
    expect(result).not.toBe(testObject);
    expect(fs.promises.writeFile).toBeCalledWith(
      "data/json/TestModel.json",
      JSON.stringify({ ID1: { id: "ID1", a: "test", b: 2 } }),
      "utf8",
    );
  });

  it("gets unique objects", async () => {
    const storeContent = { TEST_ID: { id: "TEST_ID", a: "a", b: 1 } };

    mockImplementation(fs.readFileSync, () => {
      return JSON.stringify(storeContent);
    });

    const repo = createTestRepo();

    const getResult1 = await repo.get("TEST_ID");
    const getResult2 = await repo.get("TEST_ID");

    expect(getResult1).not.toBe(getResult2);
  });

  it("deletes objects from store", async () => {
    const repo = createTestRepo();
    const testObj = { id: "TEST_ID", a: "lol", b: 2 };

    await repo.upsave(testObj);
    expect(await repo.get(testObj.id)).toEqual(testObj);

    expect(fs.promises.writeFile).toBeCalledWith(
      "data/json/TestModel.json",
      JSON.stringify({ TEST_ID: testObj }),
      "utf8",
    );

    await repo.delete(testObj.id);
    expect(await repo.get(testObj.id)).toEqual(undefined);

    expect(fs.promises.writeFile).toBeCalledWith(
      "data/json/TestModel.json",
      JSON.stringify({}),
      "utf8",
    );
  });

  it("returns undefined when getting an unknown id", async () => {
    const repo = createTestRepo();

    const result = await repo.get("not_in_repo");
    expect(result).toBe(undefined);
  });

  it("gets all objects", async () => {
    const storeContent = {
      TEST_ID: { id: "TEST_ID", a: "a", b: 1 },
      TEST_ID2: { id: "TEST_ID2", a: "different a", b: 5 },
    };

    mockImplementation(fs.readFileSync, () => {
      return JSON.stringify(storeContent);
    });

    const repo = createTestRepo();

    const allObjects = await repo.getAll();
    expect(allObjects).toEqual([
      { id: "TEST_ID", a: "a", b: 1 },
      { id: "TEST_ID2", a: "different a", b: 5 },
    ]);
  });

  it("instantiates objects when provided with an object constructor", async () => {
    const storeContent = {
      TEST_ID: new TestModelImpl({ id: "TEST_ID", a: "a", b: 1 }),
    };

    mockImplementation(fs.readFileSync, () => {
      return JSON.stringify(storeContent);
    });

    const repo = new JSONRepository<TestModelImpl>({
      name: "test",
      modelClass: TestModelImpl,
    });

    const gotObject = await repo.get("TEST_ID");

    expect(gotObject).toEqual({ id: "TEST_ID", a: "a", b: 1 });
    expect(gotObject).toBeInstanceOf(TestModelImpl);
    expect(gotObject.getA()).toBe("a");

    expect((await repo.getAll())[0]).toBeInstanceOf(TestModelImpl);

    expect(await repo.get("ID_NOT_IN_STORE")).toBe(undefined);
  });
});

interface TestModel extends ObjectWithID {
  a: string;
  b: number;
}

function resetMocks() {
  jest.resetAllMocks();

  mockImplementation(fs.promises.readFile, () => {
    Promise.reject(new Error("no file"));
  });

  mockImplementation(fs.readFileSync, () => {
    return undefined;
  });
}

function createTestRepo(): JSONRepository<TestModel> {
  return new JSONRepository<TestModel>({ name: "TestModel" });
}

function mockImplementation(mock: Function, impl: (...args: any) => any) {
  (mock as unknown as jest.Mock).mockImplementation(impl);
}
