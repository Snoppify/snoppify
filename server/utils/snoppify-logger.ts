export enum LogLevel {
  SILENT = 0,
  ALL = 1,
  TRACE = 1,
  INFO = 2,
  LOG = 3,
  WARN = 4,
  ERROR = 5,
}

let logLevel: LogLevel = LogLevel.ALL;

export const logger = {
  trace: (...args: any[]) => {
    if (checkShouldLog(LogLevel.TRACE)) formatLog(LogLevel.TRACE, ...args);
  },
  info: (...args: any[]) => {
    if (checkShouldLog(LogLevel.INFO)) formatLog(LogLevel.INFO, ...args);
  },
  log: (...args: any[]) => {
    if (checkShouldLog(LogLevel.LOG)) formatLog(LogLevel.LOG, ...args);
  },
  error: (...args: any[]) => {
    if (checkShouldLog(LogLevel.ERROR)) formatLog(LogLevel.ERROR, ...args);
  },
  warn: (...args: any[]) => {
    if (checkShouldLog(LogLevel.WARN)) formatLog(LogLevel.WARN, ...args);
  },
};

export const setLevel = (level: LogLevel) => {
  logLevel = level;
};

function checkShouldLog(level: LogLevel) {
  return logLevel <= level;
}

function formatLog(level: LogLevel, ...args: any[]) {
  console[LogLevel[level].toLowerCase()](`${LogLevel[level]}:`, ...args);
}
