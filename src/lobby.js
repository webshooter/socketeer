import Room from "./room";
import { getListeners, attachListener } from "./eventHandlers/lobbyRoom";
import messages, { keys as messageKeys } from "./messages";
import logger from "./logger";

const lobbyName = "LOBBY";

const findRoom = ({ rooms, roomId, fullCount = 2 }) => {
  if (roomId) {
    return rooms.has(roomId)
      ? { room: rooms.get(roomId) }
      : { error: messageKeys.ROOM_NOT_FOUND };
  }

  return {
    room: Array.from(rooms.values()).find((room) => room.clientCount < fullCount),
  };
};

export default class Lobby extends Room {
  #rooms = new Map();

  constructor() {
    super({ name: lobbyName });
    logger.info({
      event: "LOBBY_CREATED",
      lobby: this.toJSON(),
    });
  }

  get rooms() {
    return Array.from(this.#rooms.values());
  }

  joinRoom({ client, data }) {
    // eslint-disable-next-line prefer-const
    let { room, error } = findRoom({
      rooms: this.#rooms,
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
      .forEach((client) => this.removeClient({ client }));

    // add room to looby's room list
    this.#rooms.set(room.id, room);

    logger.info({
      event: "ROOM_CREATED",
      room: room.toJSON(),
    });

    // return the new room
    return room;
  }

  removeRoom({ room }) {
    if (!room) {
      return this.rooms;
    }

    if (this.#rooms.has(room.id)) {
      const message = messages.get(messageKeys.ROOM_CLOSING);
      room.notifyClients({ message: message({ room }) });

      this.#rooms.delete(room.id);

      logger.info({
        event: "ROOM_REMOVED",
        room: room.toJSON(),
      });
    }

    return this.rooms;
  }
}
