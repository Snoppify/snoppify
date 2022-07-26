import User from "./User";
import { UserRepository } from "./UserRepository";
import { userService } from "./UserService";

jest.mock("./UserRepository");

describe("UserService", () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    (UserRepository as jest.Mock).mockClear();
    userService.setRepository(new UserRepository());
  });

  it("gets a user by id", async () => {
    await userService.getUser("test");
    expect(
      (UserRepository as jest.Mock).mock.instances[0].get,
    ).toHaveBeenCalled();
  });

  it("saves a user", async () => {
    await userService.upsave(new User(minimalUserData()));
    expect(
      (UserRepository as jest.Mock).mock.instances[0].upsave,
    ).toHaveBeenCalledWith(new User(minimalUserData()));
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
