import User from "../models/User/User";
import { SnoppifyHost } from "../spotify";

declare global {
  namespace Express {
    /** Used in passport 🤷‍♂️ */
    interface User {
      id: string;
    }
  }
}
declare module "express-serve-static-core" {
  interface Request {
    snoppifyHost?: SnoppifyHost;
    user?: User;
  }
}

// see https://stackoverflow.com/questions/38900537/typescript-extend-express-session-interface-with-own-class
declare module "express-session" {
  interface SessionData {
    spotify?: any;
    host?: SnoppifyHost;
  }
}
