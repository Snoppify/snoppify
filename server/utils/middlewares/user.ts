import { Request, RequestHandler } from "express";

function isHost(req: Request) {
  return req.user.host && req.user.host.status === "success";
}

export const userHostAuth: RequestHandler = (req, res, next) => {
  if (!isHost(req)) {
    res.status(401).end();
    return;
  }
  next();
};
