import { Queue } from "../Queue/Queue";
import { UserBase } from "./UserBase";
import { userService } from "./UserService";

type NewUserInput = RequireSome<
  User,
  "name" | "displayName" | "username" | "id"
>;

export default class User extends UserBase {
  static users: User[];

  constructor(data: NewUserInput) {
    super();

    Object.keys(data).forEach((key) => (this[key] = data[key]));

    this.queue = new Queue({
      id: "id",
      queue: data.queue,
    });
    this.votes = {
      received: {},
      given: {},
      receivedTotal: 0,
      givenTotal: 0,
      ...data.votes,
    };
    this.friends = data.friends || [];

    User.users = [];
  }

  static clearUser(user: User) {
    user.queue.clear();
    // eslint-disable-next-line no-param-reassign
    user.votes = {
      received: {},
      given: {},
      receivedTotal: 0,
      givenTotal: 0,
    };
    // eslint-disable-next-line no-param-reassign
    user.friends = [];
  }

  /// /////////

  static find(id: string, callback: (err: any, user: User | null) => void) {
    return userService
      .getUser(id)
      .then((u) => callback(null, u as User))
      .catch((err) => callback(err, null));
  }

  static save(user?: User, callback?: (err?: any) => void) {
    return (
      userService
        .upsave(user)
        // TODO: Remove this when all refs to User.users are gone
        .then(() => userService.getAll())
        .then((users) => (User.users = users as User[]))
        // end TODO
        .then(() => callback())
        .catch((err) => callback(err))
    );
  }

  static sanitize(user: User & { _tokens: any }) {
    const { _tokens, ...sanitized } = user;
    return sanitized;
  }
}
