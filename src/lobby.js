import Room from "./room";
import { getListeners, attachListener } from "./eventHandlers/lobbyRoom";
import messages, { keys as messageKeys } from "./messages";
import logger from "./logger";

const lobbyName = "LOBBY";

const findRoom = ({ rooms, roomId, fullCount = 2 }) => {
  if (roomId) {
    const room = rooms.find((rm) => rm.id === roomId);
    return room ? { room } : { error: messageKeys.ROOM_NOT_FOUND };
  }

  return { room: rooms.find((rm) => rm.clientCount < fullCount) };
};

export default class Lobby extends Room {
  #rooms = [];

  constructor() {
    super({ name: lobbyName });
    logger.info({
      event: "LOBBY_CREATED",
      lobby: this.toJSON(),
    });
  }

  get rooms() {
    return this.#rooms;
  }

  joinRoom({ client, data }) {
    // eslint-disable-next-line prefer-const
    let { room, error } = findRoom({
      rooms: this.rooms,
      roomId: data?.roomId,
    });

    if (error === messageKeys.ROOM_NOT_FOUND) {
      // unable to find the requested room, send an error
      const getMessage = messages.get(messageKeys.ROOM_NOT_FOUND);
      this.notifyClients({
        message: getMessage({ id: data.roomId }),
        clients: [client],
      });

      return null;
    }

    if (!room) {
      room = this.createRoom({ clients: [] });
    }

    // remove the client from the lobby's client list
    this.removeClient({ client });

    // add client to room
    room.addClient({ client });

    return room;
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

    logger.info({
      event: "ROOM_CREATED",
      room: room.toJSON(),
    });

    // return the new room
    return room;
  }

  removeRoom({ id }) {
    const room = this.#rooms.find((r) => id === r.id);

    if (!room) {
      return this.rooms;
    }

    const message = messages.get(messageKeys.ROOM_CLOSING);
    room.notifyClients({ message: message({ room }) });
    this.#rooms = this.#rooms
      .filter((r) => room.id !== r.id);

    logger.info({
      event: "ROOM_REMOVED",
      room: room.toJSON(),
    });

    return this.rooms;
  }
}
