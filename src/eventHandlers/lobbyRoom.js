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
    handler: (client, room) => {
      lobby.addClient({ client });

      if (room?.clientCount < 1) {
        lobby.removeRoom(room);
      }
    },
  },
  {
    name: "disconnect-client",
    handler: (client) => lobby.emitter.emit("disconnect-client", client),
  },
];
