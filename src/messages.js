export const keys = {
  SERVER_GREET: "server-greet",
  ROOM_GREET: "room-greet",
  ROOM_CLOSING: "room-closing",
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

export default messages;
