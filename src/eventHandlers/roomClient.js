export const attachListener = ({
  client,
  listener,
  removeExisting = true,
}) => {
  if (removeExisting) {
    // console.log(`-- removing existing client.emitter listeners for ${listener.name}`);
    client.emitter.removeAllListeners(listener.name);
    // console.log(client.emitter);
  }

  // console.log(`++ adding new client.emitter listeners for ${listener.name}`);
  client.emitter.on(listener.name, listener.handler);
  // console.log(client.emitter);
};

export const getListeners = ({ client, room }) => [
  {
    name: "leave-room",
    handler: () => {
      room.removeClient({ client });
      room.emitter.emit("remove-client", client);
    },
  },
  {
    name: "disconnect",
    handler: () => {
      room.removeClient({ client });
      room.emitter.emit("disconnect-client", client);
    },
  },
  {
    name: "join-game",
    handler: () => room.joinRoom?.({ client }),
  },
  {
    name: "game-event",
    handler: (data) => {
      const clients = room
        .clients
        .filter((c) => c.id !== data.clientId);

      room.notifyClients({ message: data, clients });
    },
  },
];
