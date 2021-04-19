import Room from "./room";
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
    const room = new Room({ name });
    if (clients) {
      clients.forEach((client) => room.addClient({ client }));
    }
    this.#rooms = [...this.#rooms, room];
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
