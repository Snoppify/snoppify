import fs from "fs";
import { Queue } from "../Queue/Queue";
import User from "./User";

jest.mock("fs", () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));

describe("User", () => {
  beforeEach(() => {
    resetMocks();
    User.users = undefined;
  });

  it("creates a User from minimal input data", () => {
    const newUser = new User(minimalUserData());

    assertValidNewMinimalUser(newUser);
  });

  it("creates a new valid User from input data", () => {
    const newUser = new User(fullUserData());

    assertValidNewFullUser(newUser);
  });

  it("clears the user data", () => {
    const newUser = new User(fullUserData());

    newUser.clear();

    assertValidNewMinimalUser(newUser);
  });

  it("inits from user storage", async () => {
    (fs.readFile as unknown as jest.Mock).mockImplementation(
      (path, encoding, cb) => {
        cb(null, userDataFileContents());
      },
    );

    await initUserService();

    expect(User.users[0]).toBeInstanceOf(User);
  });

  it("inits correctly when no existing file", async () => {
    expect(User.users).toBeUndefined();

    await initUserService();

    expect(User.users).toStrictEqual([]);
  });

  it("saves new user to storage", async () => {
    await initUserService();

    const newUser = new User(fullUserData());

    expect(User.users).toStrictEqual([]);

    await saveUser(newUser);

    expect(User.users[0]).toBe(newUser);
    expect(fs.writeFile).toBeCalledWith(
      expect.any(String),
      userDataFileContents(),
      "utf8",
      expect.any(Function),
    );
  });

  it("updates existing user when saving", async () => {
    await initUserService();

    const newUser = new User(fullUserData());

    await saveUser(newUser);

    newUser.username = "New username";

    await saveUser(newUser);

    await expect(findUser(newUser.id)).resolves.toHaveProperty(
      "username",
      "New username",
    );
  });
});

function minimalUserData() {
  return {
    name: "NAME",
    username: "USERNAME",
    displayName: "DISPLAY_NAME",
    id: "ID",
  };
}

function assertValidNewMinimalUser(newUser: User) {
  const expetedUserData = minimalUserData();

  expect(newUser.name).toBe(expetedUserData.name);
  expect(newUser.username).toBe(expetedUserData.username);
  expect(newUser.displayName).toBe(expetedUserData.displayName);
  expect(newUser.id).toBe(expetedUserData.id);
  expect(newUser.queue).toStrictEqual(new Queue({ id: "id", queue: [] }));
  expect(newUser.friends).toStrictEqual([]);
  expect(newUser.votes).toStrictEqual({
    received: {},
    given: {},
    receivedTotal: 0,
    givenTotal: 0,
  });
}

function fullUserData() {
  return {
    ...minimalUserData(),
    queue: [{ id: "SONG_ID" }],
    votes: {
      received: { OTHER_USER_ID_1: 1 },
      given: { OTHER_USER_ID_1: 1, OTHER_USER_ID_2: 2 },
      receivedTotal: 1,
      givenTotal: 3,
    },
    friends: [{ name: "Friend Name", userName: "coolguy1123" }],
  };
}

function assertValidNewFullUser(newUser: User) {
  const expetedUserData = fullUserData();

  expect(newUser.name).toBe(expetedUserData.name);
  expect(newUser.username).toBe(expetedUserData.username);
  expect(newUser.displayName).toBe(expetedUserData.displayName);
  expect(newUser.id).toBe(expetedUserData.id);
  expect(newUser.queue).toStrictEqual(
    new Queue({ id: "id", queue: [{ id: "SONG_ID" }] as any }),
  );
  expect(newUser.friends).toStrictEqual(expetedUserData.friends);
  expect(newUser.votes).toStrictEqual(expetedUserData.votes);
}

function userDataFileContents() {
  return `{"users":[{"name":"NAME","username":"USERNAME","displayName":"DISPLAY_NAME","id":"ID","queue":[{"id":"SONG_ID"}],"votes":{"received":{"OTHER_USER_ID_1":1},"given":{"OTHER_USER_ID_1":1,"OTHER_USER_ID_2":2},"receivedTotal":1,"givenTotal":3},"friends":[{"name":"Friend Name","userName":"coolguy1123"}]}]}`;
}

function resetMocks() {
  jest.resetAllMocks();

  (fs.readFile as unknown as jest.Mock).mockImplementation(
    (path, encoding, cb) => {
      cb("no file");
    },
  );

  (fs.writeFile as unknown as jest.Mock).mockImplementation(
    (path, data, encoding, cb) => {
      cb();
    },
  );
}

/** Promisify User.save  */
async function saveUser(user: User) {
  return new Promise<void>((resolve, reject) => {
    User.save(user, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/** Promisify User.find */
async function findUser(id: string) {
  return new Promise((resolve, reject) => {
    User.find(id, (err: any, user: User) => {
      if (err) {
        reject(err);
      } else {
        resolve(user);
      }
    });
  });
}

async function initUserService() {
  return new Promise<void>((resolve, reject) => {
    User.init((err) => (err ? reject() : resolve()));
  });
}
