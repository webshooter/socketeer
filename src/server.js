import net from "net";
import { v4 as uuidv4 } from "uuid";
import Client from "./client";

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

    this.clients = [];

    this.netServer = net.createServer();
    this.netServer.maxConnections = this.maxConnections;
    eventHandlers
      .forEach((handler, event) => this.netServer.on(event, handler));

    // default handlers
    this.netServer.on("connection", (socket) => {
      socket.id = uuidv4();
      const client = new Client({ socket });

      this.clients = [...this.clients, client];
    });
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

  async getConnections() {
    return new Promise((resolve, reject) => {
      this.netServer.getConnections((error, count) => {
        if (error) {
          reject(error);
        }
        resolve(count);
      });
    });
  }
}
