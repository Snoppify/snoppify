import { userService as realUserService } from "../UserService";

let repo = {};

export const userService: typeof realUserService = {
  getUser: jest.fn((id: string) => Promise.resolve(repo[id])),
  upsave: jest.fn((obj: any) => {
    repo[obj.id] = { ...repo[obj.id], ...obj };
    return Promise.resolve();
  }),
  setRepository: jest.fn((newRepo: any) => (repo = { ...newRepo })),
  getAll: jest.fn(() => Promise.resolve(Object.values(repo))),
};
