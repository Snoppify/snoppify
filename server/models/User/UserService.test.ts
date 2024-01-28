import { Queue } from "../Queue/Queue";
import { type QueueTrack } from "../Queue/QueueTrack";
import User from "./User";
import { UserRepository } from "./UserRepository";
import { userService } from "./UserService";

jest.mock("./UserRepository");

describe("UserService", () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    (UserRepository as jest.Mock).mockClear();
    jest
      .spyOn(UserRepository.prototype, "upsave")
      .mockImplementation((obj) => Promise.resolve(obj));
    userService.setRepository(new UserRepository());
  });

  it("gets a user by id", async () => {
    await userService.getUser("test");
    expect(
      (UserRepository as jest.Mock).mock.instances[0].get,
    ).toHaveBeenCalledWith("test");
  });

  it("saves a user", async () => {
    await userService.upsave(new User(minimalUserData()));
    expect(
      (UserRepository as jest.Mock).mock.instances[0].upsave,
    ).toHaveBeenCalledWith(new User(minimalUserData()));
  });

  it("adds a track to the queue", async () => {
    const user = new User(minimalUserData());

    const updatedUser = await userService.addToQueue(user, {
      id: "new_track_id",
    });

    expect(updatedUser.queue.getAt(0)).toEqual({ id: "new_track_id" });
  });

  it("removes a track from the queue", async () => {
    const user = new User({
      ...minimalUserData(),
      queue: new Queue<QueueTrack>({
        queue: [{ id: "track_id" } as QueueTrack],
      }),
    });

    expect(user.queue.size).toBe(1);

    const updatedUser = await userService.removeFromQueue(user, {
      id: "track_id",
    });
    expect(updatedUser.queue.size).toBe(0);
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
