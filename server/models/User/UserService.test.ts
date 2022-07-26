/* eslint-disable import/first */
import User from "./User";
import { UserRepository } from "./UserRepository";
import { userService } from "./UserService";

console.log("import repo");

jest.mock("./UserRepository", () => {});
const mockedUserRepo = jest.mocked(UserRepository, true);

console.log("import service");

describe("UserService", () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    // (UserRepository as unknown as jest.Mock).mockClear();
    mockedUserRepo.mockRestore();
  });

  it("gets a user by id", async () => {
    const user = await userService.getUser("test");
    // expect((UserRepository as any).mock.instances[0].get).toHaveBeenCalled();
    // expect(mockedUserRepo).toHaveBeenCalled();
    expect(mockedUserRepo.mock.instances[0].get).toHaveBeenCalled();
    expect(user).toBeInstanceOf(User);
  });
});
