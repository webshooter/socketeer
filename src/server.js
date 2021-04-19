import net from "net";
import { v4 as uuidv4 } from "uuid";
import Client from "./client";
import Lobby from "./lobby";
import messages, { keys as messageKeys } from "./messages";

// TODO: Do we really need these?
const noop = () => {};
const defaultEventHandlers = new Map();
defaultEventHandlers.set("connection", noop);
defaultEventHandlers.set("close", noop);
defaultEventHandlers.set("listening", noop);
// eslint-disable-next-line no-console
defaultEventHandlers.set("error", (err) => console.error(err));

// TODO: codify standard notification funcitons
// and move them into their own file(s)
const notifications = new Map();
notifications.set("GREET", ({ client }) => ({
  key: "greet",
  id: client.id,
}));

export default class Server {
  constructor({
    eventHandlers = defaultEventHandlers,
    maxConnections = 10,
    port = 8999,
  } = {}) {
    this.port = port;
    this.maxConnections = maxConnections;
    this.eventHandlers = eventHandlers;

    this.lobby = new Lobby();

    this.netServer = net.createServer();
    this.netServer.maxConnections = this.maxConnections;
    eventHandlers
      .forEach((handler, event) => this.netServer.on(event, handler));

    // default handlers
    this.netServer.on("connection", (socket) => {
      socket.id = uuidv4();
      const client = new Client({ socket });

      this.lobby.addClient({ client });
      client.notify({
        message: messages.get(messageKeys.SERVER_GREET)(),
      });
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

  async close() {
    return new Promise((resolve, reject) => {
      if (this.netServer) {
        this.netServer.close(() => resolve(this.netServer));
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
