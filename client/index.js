const appRootPath = require("app-root-path");
const dotenv = require("dotenv");
const express = require("express");
const fallback = require("express-history-api-fallback");
const fs = require("fs");
const http = require("http");
const https = require("https");
const ip = require("ip");

dotenv.config();

const app = express();
const port = process.env.PORT || 80;

const rootDir = `${appRootPath}/dist`;

const useHttps = false;
let httpServer;
if (useHttps) {
  httpServer = https.createServer(
    {
      key: fs.readFileSync(`${appRootPath}/ssl/privatekey.key`),
      cert: fs.readFileSync(`${appRootPath}/ssl/certificate.crt`),
    },
    app,
  );
} else {
  httpServer = http.createServer(app);
}

app.use(express.static(rootDir));
app.use(
  fallback("index.html", {
    root: rootDir,
  }),
);

httpServer.listen(port, () => {
  const ipAddr = ip.address();

  console.log(`Serving http${useHttps ? "s" : ""}://${ipAddr}:${port}`);
});
