import { Queue } from "../Queue/Queue";
import User from "./User";

describe("User", () => {
  it("creates a new valid User from input data", () => {
    const newUser = new User(newUserData());

    assertValidNewUser(newUser);
  });
});

function assertValidNewUser(newUser: User) {
  expect(newUser.name).toBe(newUserData().name);
  expect(newUser.username).toBe(newUserData().username);
  expect(newUser.displayName).toBe(newUserData().displayName);
  expect(newUser.id).toBe(newUserData().id);
  expect(newUser.queue).toStrictEqual(
    new Queue({ id: "id", queue: [{ id: "SONG_ID" }] as any }),
  );
  expect(newUser.friends).toStrictEqual([]);
  expect(newUser.votes).toStrictEqual({
    received: {},
    given: {},
    receivedTotal: 0,
    givenTotal: 0,
  });
}

function newUserData() {
  return {
    name: "NAME",
    username: "USERNAME",
    displayName: "DISPLAY_NAME",
    id: "ID",
    queue: [{ id: "SONG_ID" }],
  } as User;
}
