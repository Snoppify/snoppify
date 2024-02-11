import { userService as realUserService } from "../UserService";

let repo = {};

export const userService: typeof realUserService = {
  getUser: jest.fn((id: string) => Promise.resolve(repo[id])),
  getUserByUsername: jest.fn(() => Promise.resolve(undefined)),
  upsave: jest.fn((obj: any) => {
    repo[obj.id] = { ...repo[obj.id], ...obj };
    return Promise.resolve(obj);
  }),
  setRepository: jest.fn((newRepo: any) => (repo = { ...newRepo })),
  getAll: jest.fn(() => Promise.resolve(Object.values(repo))),
  getAllInParty: jest.fn(() => Promise.resolve(Object.values(repo))),
  addToQueue: jest.fn((user: any) => Promise.resolve(user)),
  removeFromQueue: jest.fn((user: any) => Promise.resolve(user)),
};
