import { ChildProcess, fork } from "child_process";
import { app, BrowserWindow } from "electron";

let serverProcess: ChildProcess;
let win: BrowserWindow;

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {},
    backgroundColor: "#181818",
  });

  // and load the index.html of the app.
  win.loadFile("index.html");
  win.on("close", () => (win = null));

  startServer();
}

function startServer() {
  serverProcess = fork(`${__dirname}/../server-dist/index.js`);

  serverProcess.on("message", (msg) => {
    console.log("MESSAGE:", msg);
    // sent from server/index.ts after the http server is up and
    // running
    if (msg === "SERVER_STARTED") {
      win.loadURL("http://localhost:3000/host");
    }
  });

  win.on("close", () => {
    serverProcess.kill();
  });
}

app.on("ready", createWindow);
