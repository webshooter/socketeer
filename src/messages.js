const messages = new Map();
messages.set("SERVER_GREET", ({ client, error }) => ({
  key: "server-greet",
  id: client.id,
  error,
}));

messages.set("ROOM_GREET", ({ client, room, error }) => ({
  key: "server-greet",
  id: client.id,
  error,
  room: {
    id: room.id,
    name: room.name,
    clients: room.clients,
  },
}));

export default messages;
