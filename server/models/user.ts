const fs = require("fs");
const Queue = require("../Queue");

export default class User {
  static users: any[];

  static usersFile: string;

  queue: any;

  votes: any;

  friends: any;

  constructor(data) {
    for (const key in data) {
      this[key] = data[key];
    }
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

  save(callback) {
    return User.save(this, callback);
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

  static findIndex(id, callback) {
    this.init((err) => {
      if (err) {
        return callback(err, null);
      }
      const index = User.users.findIndex((u) => u.id == id);
      return callback(null, index);
    });
  }

  static save(user?, callback?) {
    this.init((err) => {
      if (err) {
        return callback(err);
      }
      if (user) {
        User.findIndex(user.id, (err, index) => {
          if (err) {
            return callback(err);
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
    });
  }

  static init(callback) {
    if (typeof User.users !== "undefined") {
      return callback();
    }
    // load saved user data
    fs.readFile(User.usersFile, "utf8", (err, data) => {
      if (err) {
        User.users = [];
        return User.saveToFile(callback);
      }
      try {
        const users = JSON.parse(data);
        if (!users.users) {
          throw "Invalid format";
        }
        User.users = users.users.map((user) => new User(user));
      } catch (e) {
        User.users = [];
      }
      return callback(null);
    });
  }

  static saveToFile(callback) {
    const _users = [];
    User.users.forEach((user) => {
      const _user = JSON.parse(JSON.stringify(user));
      _user.queue = user.queue.queue;
      _users.push(_user);
    });
    const json = JSON.stringify({
      users: _users,
    });

    return fs.writeFile(User.usersFile, json, "utf8", (err) => {
      if (err) {
        return callback(err);
      }
      return callback(null);
    });
  }

  static sanitize(user) {
    // @ts-ignore: exlude _tokens field
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
