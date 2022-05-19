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

  it("inits from user storage", (done) => {
    (fs.readFile as unknown as jest.Mock).mockImplementation(
      (path, encoding, cb) => {
        cb(null, userDataFileContents());
      },
    );

    User.init((err) => {
      try {
        expect(err).toBe(null);
        expect(User.users[0]).toBeInstanceOf(User);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("inits correctly when no existing file", (done) => {
    expect(User.users).toBeUndefined();

    User.init((err) => {
      try {
        expect(err).toBeNull();
        expect(User.users).toStrictEqual([]);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("saves new user to storage", (done) => {
    resetMocks();

    User.init(() => {
      const newUser = new User(fullUserData());

      expect(User.users).toStrictEqual([]);

      User.save(newUser, (err) => {
        try {
          expect(err).toBeNull();
          expect(User.users[0]).toBe(newUser);
          expect(fs.writeFile).toBeCalledWith(
            expect.any(String),
            userDataFileContents(),
            "utf8",
            expect.any(Function),
          );
          done();
        } catch (error) {
          done(error);
        }
      });
    });
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
