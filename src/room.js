import { v4 as uuidv4 } from "uuid";
import { EventEmitter } from "events";
import { getListeners, attachListener } from "./eventHandlers/roomClient";
import messages, { keys as messageKeys } from "./messages";
import logger from "./logger";

const idRegEx = new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
const isValidName = ({ name }) => (name && name.toString().length > 0);

export default class Room {
  #clients = new Map();

  static isValidId({ id }) {
    return idRegEx.test(id);
  }

  constructor({ name } = {}) {
    this.id = uuidv4();
    this.createdAt = Date.now();
    this.emitter = new EventEmitter();
    this.name = isValidName({ name })
      ? name
      : `[${this.id}]`;
  }

  get clients() {
    return Array.from(this.#clients.values());
  }

  get clientCount() {
    return this.#clients.size || 0;
  }

  addClient({ client, sendGreeting = true }) {
    // TODO: throw an error here?
    if (!client) {
      return this.clients;
    }

    // remove any exiting room event listeners
    // and attach listeners for THIS room
    getListeners({ client, room: this })
      .forEach((listener) => attachListener({
        client,
        listener,
      }));

    // add new client to this room's client list
    this.#clients.set(client.id, client);

    // send room greeting message to new client
    if (sendGreeting) {
      const greeting = messages.get(messageKeys.ROOM_GREET);
      this.notifyClients({
        message: greeting({ room: this }),
        clients: [client],
      });
    }

    // send new player message to the
    // other clients in the room
    const newPlayerMessage = messages.get(messageKeys.NEW_PLAYER);
    this.notifyClients({
      message: newPlayerMessage({ client, room: this }),
      clients: this.clients.filter((c) => c.id !== client.id),
    });

    logger.info({
      event: "CLIENT_JOINED_ROOM",
      client: { id: client.id },
      room: this.toJSON(),
    });

    return this.clients;
  }

  removeClient({ client }) {
    const removed = this.#clients.delete(client.id);

    if (removed) {
      logger.info({
        event: "CLIENT_REMOVED_ROOM",
        client: { id: client.id },
        room: this.toJSON(),
      });

      this.emitter.emit("removed-client", client, this);
    }

    return this.clients;
  }

  notifyClients({ message, clients }) {
    const targetClientIds = (clients || Array.from(this.clients.values()))
      .map(({ id }) => id);

    return this.clients.reduce((acc, client) => {
      if (targetClientIds.includes(client.id)) {
        acc.push({
          id: client.id,
          notified: client.notify({ message }),
          message,
        });
      }
      return acc;
    }, []);
  }

  toJSON() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      name: this.name,
      clients: Array.from(this.#clients.values()).map((client) => client.id),
    };
  }
}
