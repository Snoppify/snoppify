const fs = require("fs");
const Queue = require('../Queue');

class User {

    constructor(data) {
        for (let key in data) {
            this[key] = data[key];
        }
        this.queue = new Queue({
            id: 'id',
            queue: data.queue,
        });
    }

    save(callback) {
        User.save(this, callback);
    }

    ////////////

    static find(id, callback) {
        this.init(err => {
            if (err) {
                callback(err, null);
                return;
            }
            let user = User.users.find(u => {
                return u.id == id;
            });
            callback(null, user);
        });
    }

    static findIndex(id, callback) {
        this.init(err => {
            if (err) {
                callback(err, null);
                return;
            }
            let index = User.users.findIndex(u => {
                return u.id == id;
            });
            callback(null, index);
        });
    }

    static save(user, callback) {
        this.init(err => {
            if (err) {
                callback(err);
                return;
            }
            if (user) {
                User.findIndex(user.id, (err, index) => {
                    if (err) {
                        callback(err);
                        return;
                    }
                    if (index == -1) {
                        // add user
                        User.users.push(user);
                    }
                    else {
                        // update user in case the reference was lost somewhere
                        User.users[index] = user;
                    }
                    User.saveToFile(callback);
                });
            }
            else {
                User.saveToFile(callback || function() {});
            }
        });
    }

    static init(callback) {
        if (typeof User.users != "undefined") {
            return callback();
        }
        // load saved user data
        fs.readFile(User.usersFile, 'utf8', function readFileCallback(err, data) {
            console.log(err);
            try {
                let users = JSON.parse(data);
                if (!users.users) {
                    throw "Invalid format";
                }
                User.users = users.users.map(user => new User(user));
            }
            catch (e) {
                User.users = [];
            }
            callback(null);
        });
    }

    static saveToFile(callback) {
        let _users = [];
        User.users.forEach(user => {
            let _user = JSON.parse(JSON.stringify(user));
            _user.queue = user.queue.queue;
            _users.push(_user);
        });
        let json = JSON.stringify({
            users: _users
        });
        fs.writeFile(User.usersFile, json, 'utf8', function(err) {
            if (err) {
                callback(err);
                return;
            }
            callback(null);
        });
    }

}

//User.users = [];
User.usersFile = 'data/snoppify-users.json';

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

module.exports = User;