import { readFile, writeFile } from "fs";
import { Queue } from "../Queue/Queue";
import { UserBase } from "./UserBase";

type NewUserInput = RequireSome<
  User,
  "name" | "displayName" | "username" | "id"
>;

export default class User extends UserBase {
  static users: User[];

  static usersFile: string;

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
  }

  clear() {
    this.queue.clear();
    this.votes = {
      received: {},
      given: {},
      receivedTotal: 0,
      givenTotal: 0,
    };
    this.friends = [];
  }

  /// /////////

  static find(id, callback) {
    this.init((err) => {
      if (err) {
        return callback(err, null);
      }
      const user = User.users.find((u) => u.id == id);
      return callback(null, user);
    });
  }

  private static findIndex(id, callback) {
    this.init((err) => {
      if (err) {
        return callback(err, null);
      }
      const index = User.users.findIndex((u) => u.id == id);
      return callback(null, index);
    });
  }

  static save(user?, callback?: (err?: any) => void) {
    this.init((err) => {
      if (err) {
        return callback(err);
      }
      if (user) {
        User.findIndex(user.id, (_err, index) => {
          if (_err) {
            return callback(_err);
          }
          if (index == -1) {
            // add user
            User.users.push(user);
          } else {
            // update user in case the reference was lost somewhere
            User.users[index] = user;
          }
          return User.saveToFile(callback);
        });
      } else {
        return User.saveToFile(callback || (() => {}));
      }

      return undefined;
    });
  }

  static init(callback: (err?: any) => void) {
    if (typeof User.users !== "undefined") {
      return callback();
    }
    // load saved user data
    readFile(User.usersFile, "utf8", (err, data) => {
      if (err) {
        User.users = [];
        return User.saveToFile(callback);
      }
      try {
        const users = JSON.parse(data);
        if (!users.users) {
          throw new Error("Invalid format");
        }
        User.users = users.users.map((user) => new User(user));
      } catch (e) {
        User.users = [];
      }
      return callback(null);
    });

    return undefined;
  }

  private static saveToFile(callback: (err?: any) => void) {
    const users = [];
    User.users.forEach((user) => {
      const userCopy = JSON.parse(JSON.stringify(user));
      userCopy.queue = user.queue.queue;
      users.push(userCopy);
    });
    const json = JSON.stringify({
      users,
    });

    return writeFile(User.usersFile, json, "utf8", (err) => {
      if (err) {
        return callback(err);
      }
      return callback(null);
    });
  }

  static sanitize(user) {
    const { _tokens, ...sanitized } = user;
    return sanitized;
  }
}

// User.users = [];
User.usersFile = "data/snoppify-users.json";

// define the actual singleton instance
// ------------------------------------

// const USER_KEY = Symbol("User");

// global[USER_KEY] = User;

// // define the singleton API
// // ------------------------

// const singleton = global[USER_KEY];

// // ensure the API is never changed
// // -------------------------------

// Object.freeze(singleton);

// export the singleton API only
// -----------------------------
