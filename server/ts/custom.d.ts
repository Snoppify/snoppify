import { SnoppifyHost } from "../spotify";

declare module "express-serve-static-core" {
  interface Request {
    snoppifyHost?: SnoppifyHost;
  }
}

// see https://stackoverflow.com/questions/38900537/typescript-extend-express-session-interface-with-own-class
declare module "express-session" {
  interface SessionData {
    spotify?: any;
    host?: SnoppifyHost;
  }
}
