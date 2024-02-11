import { Request, RequestHandler } from "express";
import activityLogger from "../activity-logger";

function isHost(req: Request) {
  return req.user && req.user.host && req.user.host.status === "success";
}

function logUserActivity(req: Request) {
  if (req.isAuthenticated() && req.snoppifyHost) {
    activityLogger.log(req.snoppifyHost);
  }
}

export const userHostAuth: RequestHandler = (req, res, next) => {
  if (!isHost(req)) {
    res.status(401).end();
    return;
  }
  logUserActivity(req);
  next();
};

export const userGuestAuth: RequestHandler = (req, res, next) => {
  logUserActivity(req);
  next();
};
