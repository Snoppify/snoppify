import { SnoppifyHost } from "../spotify";
import { logger } from "./snoppify-logger";

type ActivityEntry = {
  host: SnoppifyHost;
  date: Date;
};

const CHECK_INTERVAL = 1000 * 60 * 30; // 30 minutes
const INACTIVITY_TIMEOUT = 1000 * 60 * 60 * 2; // 2 hours
const activityLog: { [key: string]: ActivityEntry } = {};

(function activityChecker() {
  setInterval(() => {
    const now = new Date();

    for (const key in activityLog) {
      if (activityLog[key]) {
        const { host, date } = activityLog[key];
        const party = host.controller.getParty();
        const { hostUser } = party;
        if (now.getTime() - date.getTime() > INACTIVITY_TIMEOUT) {
          logger.info(
            `Closing party ${party.id} due to inactivity, hosted by ${hostUser.displayName} (${hostUser.username}).`,
          );
          host.api.close();
          host.controller.stop();
          delete activityLog[key];
        }
      }
    }
  }, CHECK_INTERVAL);
})();

function log(host: SnoppifyHost) {
  const party = host.controller.getParty();
  if (!party) return;
  activityLog[party.id] = {
    host,
    date: new Date(),
  };
}

export default {
  log,
};
