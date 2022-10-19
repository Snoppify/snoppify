import { StaticQueue } from "../Queue/StaticQueue";
import { UserBase } from "./UserBase";

type NewUserInput = RequireSome<
  User,
  "name" | "displayName" | "username" | "id"
>;

export default class User extends UserBase {
  queue: StaticQueue<{ id: string }>;

  constructor(data: NewUserInput) {
    super();

    Object.keys(data).forEach((key) => (this[key] = data[key]));

    this.queue = new StaticQueue({
      id: "id",
      queue: data.queue?.queue,
    });
    this.votes = {
      received: {},
      given: {},
      receivedTotal: 0,
      givenTotal: 0,
      ...data.votes,
    };
    this.friends = data.friends || [];
  }

  // TODO: Move to UserService and call QueueService to empty queue
  static clearUser(user: User) {
    // user.queue.clear();  // TODO: Move to UserService and call QueueService to empty queue
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

  static sanitize(user: User) {
    const { _tokens, ...sanitized } = user;
    return sanitized;
  }
}
