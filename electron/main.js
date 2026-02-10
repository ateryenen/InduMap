const { app, BrowserWindow } = require("electron");
const path = require("path");
const http = require("http");
const handler = require("serve-handler");

let mainWindow = null;
let server = null;

function createStaticServer() {
  return new Promise((resolve, reject) => {
    const staticDir = path.join(__dirname, "../out");

    const srv = http.createServer((req, res) =>
      handler(req, res, {
        public: staticDir,
        cleanUrls: true
      })
    );

    // 用 0 讓系統自動選一個沒被占用的 port
    srv.listen(0, "127.0.0.1", () => {
      const address = srv.address();
      if (!address || typeof address.port !== "number") {
        reject(new Error("Failed to get server port"));
        return;
      }
      resolve({ server: srv, port: address.port });
    });

    srv.on("error", (err) => {
      reject(err);
    });
  });
}

async function createWindow() {
  try {
    const { server: srv, port } = await createStaticServer();
    server = srv;

    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    const url = `http://127.0.0.1:${port}/`;
    mainWindow.loadURL(url);

    mainWindow.on("closed", () => {
      mainWindow = null;
    });
  } catch (err) {
    console.error("Failed to start static server:", err);
    app.quit();
  }
}

app.whenReady().then(createWindow);

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("window-all-closed", () => {
  if (server) {
    server.close();
    server = null;
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});
