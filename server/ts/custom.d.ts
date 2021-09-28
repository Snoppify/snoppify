import { SnoppifyHost } from "../spotify";

declare module 'express-serve-static-core' {
    interface Request {
        snoppifyHost?: SnoppifyHost;
    }
}


declare module 'express-session' {
    interface SessionData {
        spotify?: any;
        host?: SnoppifyHost;
    }
}
