- add getAll in UserRepo (used by spotify-controller 🤮)
- replace getAll with getUsersAtParty or even better add rebuildQueue to userService or smth?
  - create queueService/repo, remove Queue from User!
- return new User objects from UserService after updates etc.
- Move spotify-controller: emptyQueue, to userService or queueService, make party-specific