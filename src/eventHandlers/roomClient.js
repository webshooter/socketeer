export const attachListener = ({
  client,
  listener,
  removeExisting = true,
}) => {
  if (removeExisting) {
    client.emitter.removeAllListeners(listener.name);
  }

  client.emitter.on(listener.name, listener.handler);
};

export const getListeners = ({ client, room }) => [
  {
    name: "leave-room",
    handler: () => {
      room.removeClient(client);
      room.emitter.emit("remove-client", client);
    },
  },
  {
    name: "disconnect",
    handler: () => {
      room.removeClient(client);
      room.emitter.emit("disconnect-client", client);
    },
  },
];
