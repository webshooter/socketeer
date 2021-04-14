import net from "net";

const noop = () => {};
const defaultEventHandlers = new Map();
defaultEventHandlers.set("connection", noop);
defaultEventHandlers.set("close", noop);
defaultEventHandlers.set("error", noop);
defaultEventHandlers.set("listening", noop);

export default class Server {
  constructor({
    eventHandlers = defaultEventHandlers,
    maxConnections = 10,
    port = 8999,
  } = {}) {
    this.port = port;
    this.maxConnections = maxConnections;
    this.eventHandlers = eventHandlers;

    this.netServer = net.createServer();
    eventHandlers
      .forEach((handler, event) => this.netServer.on(event, handler));
  }

  async listen() {
    return new Promise((resolve, reject) => {
      if (this.netServer) {
        this.netServer.listen(this.port, () => {
          resolve(this.netServer);
        });
      } else {
        reject(new Error("Error starting server!"));
      }
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      if (this.netServer) {
        this.netServer.close(() => {
          resolve(this.netServer);
        });
      } else {
        reject(new Error("Error closing server!"));
      }
    });
  }
}
