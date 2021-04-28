export const keys = {
  SERVER_GREET: "server-greet",
  ROOM_GREET: "room-greet",
  ROOM_CLOSING: "room-closing",
  NEW_PLAYER: "new-player",
  ROOM_NOT_FOUND: "room-not-found",
};

const messages = new Map();
messages.set(keys.SERVER_GREET, ({ error } = {}) => ({
  key: keys.SERVER_GREET,
  error,
}));

messages.set(keys.ROOM_GREET, ({ error, room } = {}) => ({
  key: keys.ROOM_GREET,
  error,
  room: room.toJSON(),
}));

messages.set(keys.ROOM_CLOSING, ({ room } = {}) => ({
  key: keys.ROOM_CLOSING,
  room: room.toJSON(),
}));

messages.set(keys.NEW_PLAYER, ({ client, room } = {}) => ({
  key: keys.NEW_PLAYER,
  newPlayerId: client.id,
  room: room.toJSON(),
}));

messages.set(keys.ROOM_NOT_FOUND, ({ id }) => ({
  key: keys.ROOM_NOT_FOUND,
  roomId: id,
}));

export default messages;
