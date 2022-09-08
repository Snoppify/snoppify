import { Queue } from "../Queue/Queue";
import { UserBase } from "./UserBase";

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

  static sanitize(user: User & { _tokens: any }) {
    const { _tokens, ...sanitized } = user;
    return sanitized;
  }
}
