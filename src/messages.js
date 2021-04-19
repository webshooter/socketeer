export const keys = {
  SERVER_GREET: "server-greet",
  ROOM_GREET: "room-greet",
  ROOM_CLOSING: "room-closing",
};

const messages = new Map();
messages.set(keys.SERVER_GREET, ({ client, error }) => ({
  key: keys.SERVER_GREET,
  id: client.id,
  error,
}));

messages.set(keys.ROOM_GREET, ({ client, room, error }) => ({
  key: keys.ROOM_GREET,
  id: client.id,
  error,
  room: {
    id: room.id,
    name: room.name,
    clients: room.clients,
  },
}));

messages.set(keys.ROOM_CLOSING, ({ room } = {}) => ({
  key: keys.ROOM_CLOSING,
  room: {
    id: room.id,
    name: room.name,
    clients: room.clients,
  },
}));

export default messages;
