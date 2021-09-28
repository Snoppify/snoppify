import { SnoppifyHost } from "../spotify";

declare global {
    namespace Express {
        export interface Request {
            snoppifyHost?: SnoppifyHost;
        }
    }
}