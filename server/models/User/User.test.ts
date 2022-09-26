import { Queue } from "../Queue/Queue";
import User from "./User";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { userService } from "./UserService";

jest.mock("./UserService.ts");

describe("User", () => {
  beforeEach(() => {
    userService.setRepository({} as any);
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

    User.clearUser(newUser);

    assertValidNewMinimalUser(newUser);
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
    friends: [{ name: "Friend Name", username: "coolguy1123" }],
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
