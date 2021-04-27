import split2 from "split2";

const dataEventHandlers = [
  {
    key: "leave-room",
    handler: ({ client }) => client.emitter.emit("leave-room"),
  },
  {
    key: "disconnect",
    handler: ({ client }) => client.emitter.emit("disconnect"),
  },
  {
    key: "game-event",
    handler: ({ client, data }) => client.emitter.emit("game-event", data),
  },
];

const acknowledgement = ({ key, data, id }) => ({
  id,
  key,
  data,
  type: "ACK",
});

export const attachListener = ({
  socket,
  listener: { name, handler },
  removeExisting = true,
}) => {
  if (removeExisting) {
    socket.removeAllListeners(name);
  }

  socket
    .pipe(split2(JSON.parse))
    .on(name, handler);
};

export const getListeners = ({ client }) => [
  {
    name: "data",
    handler: ({ key, data }) => {
      // do handler
      dataEventHandlers
        .filter(({ key: eventKey }) => key === eventKey)
        .forEach(({ handler: eventHandler }) => eventHandler({
          client,
          data,
        }));

      // send acknowledgement
      client
        .socket
        .write(`${JSON.stringify(acknowledgement({
          key,
          data,
          id: client.id,
        }))}\n`);
    },
  },
  {
    name: "error",
    // eslint-disable-next-line no-console
    handler: (error) => console.error(error),
  },
];
