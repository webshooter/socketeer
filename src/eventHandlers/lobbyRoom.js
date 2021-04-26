export const attachListener = ({
  room,
  listener,
  removeExisting = true,
}) => {
  if (removeExisting) {
    room.emitter.removeAllListeners(listener.name);
  }

  room.emitter.on(listener.name, listener.handler);
};

export const getListeners = ({ lobby }) => [
  {
    name: "removed-client",
    handler: (client) => lobby.addClient({ client }),
  },
  {
    name: "disconnect-client",
    handler: (client) => lobby.emitter.emit("disconnect-client", client),
  },
];
