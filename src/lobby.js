import Room from "./room";
import { getListeners, attachListener } from "./eventHandlers/lobbyRoom";
import messages, { keys as messageKeys } from "./messages";

const lobbyName = "LOBBY";

export default class Lobby extends Room {
  #rooms = [];

  constructor() {
    super({ name: lobbyName });
  }

  get rooms() {
    return this.#rooms;
  }

  createRoom({ name, clients } = {}) {
    // create new room
    const room = new Room({ name });

    // add event listeners for room events
    getListeners({ lobby: this })
      .forEach((listener) => attachListener({ room, listener }));

    // add clients to new room
    clients?.forEach((client) => room.addClient({ client }));

    // remove room clients from lobby clients list
    room
      .clients
      .map((client) => client.id)
      .forEach((id) => this.removeClient({ id }));

    // add room to looby's room list
    this.#rooms = [...this.#rooms, room];

    // return the new room
    return room;
  }

  removeRoom({ id }) {
    const room = this.#rooms.find((r) => id === r.id);
    if (room) {
      const message = messages.get(messageKeys.ROOM_CLOSING);
      room.notifyClients({ message: message({ room }) });
      this.#rooms = this.#rooms
        .filter((r) => room.id !== r.id);
    }

    return this.rooms;
  }
}
