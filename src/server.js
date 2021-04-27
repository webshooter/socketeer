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

export default class Server {
  #clients = new Map();

  constructor({
    eventHandlers = defaultEventHandlers,
    maxConnections = 10,
    port = 8999,
  } = {}) {
    this.port = port;
    this.maxConnections = maxConnections;
    this.eventHandlers = eventHandlers;

    this.lobby = new Lobby();
    this.lobby.emitter.on("disconnect-client", (client) => {
      client.socket.end();
    });

    this.netServer = net.createServer();
    this.netServer.maxConnections = this.maxConnections;
    eventHandlers
      .forEach((handler, event) => this.netServer.on(event, handler));

    this.netServer.on("connection", (socket) => {
      // assign the socket an id
      socket.id = uuidv4();

      // create a new client with the socket
      const client = new Client({ socket });

      // add new client to the server's client map
      this.#clients.set(client.id, client);

      // put new client in the lobby
      this.lobby.addClient({ client });
      client.notify({
        message: messages.get(messageKeys.SERVER_GREET)(),
      });
    });
  }

  get clients() {
    return this.#clients;
  }

  getClient({ id }) {
    return this.#clients.get(id);
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
