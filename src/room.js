import { v4 as uuidv4 } from "uuid";
import messages, { keys as messageKeys } from "./messages";

const idRegEx = new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
const isValidName = ({ name }) => (name && name.toString().length > 0);

export default class Room {
  #clients = [];

  static isValidId({ id }) {
    return idRegEx.test(id);
  }

  constructor({ name } = {}) {
    this.id = uuidv4();
    this.name = isValidName({ name })
      ? name
      : `[${this.id}]`;
  }

  get clients() {
    return this.#clients;
  }

  addClient({ client }) {
    this.#clients = [...this.#clients, client];
    if (sendGreeting) {
      const greeting = messages.get(messageKeys.ROOM_GREET);
      this.notifyClients({
        message: greeting({ room: this }),
        clients: [client],
      });
    }
    return this.clients;
  }

  removeClient({ id }) {
    this.#clients = this.#clients
      .filter((client) => id !== client.id);

    return this.clients;
  }

  notifyClients({ message, clients }) {
    const targetClientIds = (clients || this.clients)
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
      name: this.name,
      clients: this.#clients.map((client) => client.id),
    };
  }
}
