import net from "net";
import { v4 as uuidv4 } from "uuid";
import split2 from "split2";
import Client from "../src/client";
import Server from "../src/server";
import { keys as messageKeys } from "../src/messages";

const testSocket = ({ id = uuidv4() } = {}) => {
  const socket = new net.Socket();
  socket.id = id;
  return socket;
};

describe("Client", () => {
  it("isValidId enforces id format", async () => {
    expect(Client.isValidId({ id: uuidv4() })).toBe(true);
  });

  describe("when creating a new client", () => {
    it("throws an error if no socket is provided", async () => {
      expect(() => new Client({}))
        .toThrow("Client requires a valid socket!");
    });

    it("returns a client with a valid id", async () => {
      expect(Client.isValidId(new Client({ socket: testSocket() }))).toBe(true);
    });

    it("attached the provided socket to the client", async () => {
      const socket = testSocket();
      const client = new Client({ socket });
      expect(client.socket).toMatchObject(socket);
    });
  });

  describe("when sending notifications", () => {
    it("passes the message to the socket's write method", async () => {
      const socket = testSocket();
      const writeSpy = jest.spyOn(socket, "write");
      const message = { id: uuidv4(), key: "test-key", data: "test-data" };
      const client = new Client({ socket });
      writeSpy.mockImplementation(() => true);
      client.notify({ message });

      expect(writeSpy).toHaveBeenCalledTimes(1);
    });

    it("doesn't send notification if socket is destroyed", async () => {
      const socket = testSocket();
      const writeSpy = jest.spyOn(socket, "write");
      const message = { id: uuidv4(), key: "test-key", data: "test-data" };
      const client = new Client({ socket });
      socket.destroy();
      client.notify({ message });

      expect(writeSpy).toHaveBeenCalledTimes(0);
    });

    it("returns a notification data packet", async () => {
      const socket = testSocket();
      const writeSpy = jest.spyOn(socket, "write");
      const message = { id: uuidv4(), key: "test-key", data: "test-dataX" };
      const client = new Client({ socket });
      writeSpy.mockImplementation(() => true);
      const dataPacket = client.notify({ message });
      expect(dataPacket).toEqual({
        clientId: socket.id,
        message,
      });
    });

    it("returns an error notification data packet if socket is destroyed", async () => {
      const socket = testSocket();
      const message = { id: uuidv4(), key: "test-key", data: "test-data" };
      const client = new Client({ socket });
      socket.destroy();
      const dataPacket = client.notify({ message });
      expect(dataPacket).toEqual({
        clientId: socket.id,
        error: "Client socket was closed",
        message,
      });
    });
  });

  describe("when receiving socket messages", () => {
    let defaultServer;
    let defaultPort;
    let eventHandlers;
    let client;
    let socket;

    beforeEach(async () => {
      defaultPort = 3334;
      eventHandlers = new Map();
      eventHandlers.set("connection", jest.fn());
      eventHandlers.set("listening", jest.fn());
      eventHandlers.set("close", jest.fn());
      eventHandlers.set("error", jest.fn());

      defaultServer = new Server({
        port: defaultPort,
        eventHandlers,
      });

      await defaultServer.listen();

      socket = testSocket();
      client = await new Promise((resolve) => {
        socket
          .pipe(split2(JSON.parse))
          .on("data", ({ key, id }) => {
            if (key === messageKeys.SERVER_GREET) {
              resolve(defaultServer.getClient({ id }));
            }
          });

        socket.connect(defaultServer);
      });

      client.emitter = { emit: jest.fn() };
    });

    afterEach(async () => {
      await socket.end();
      await defaultServer?.close();
    });

    describe("with leave-room message", () => {
      it("emits the leave room event", async () => {
        const message = { key: "leave-room" };
        await new Promise((resolve) => {
          socket
            .pipe(split2(JSON.parse))
            .on("data", ({ key, type }) => {
              if (key === message.key && type === "ACK") {
                resolve();
              }
            });

          socket.write(`${JSON.stringify(message)}\n`);
        });

        expect(client.emitter.emit)
          .toHaveBeenCalledTimes(1);

        expect(client.emitter.emit)
          .toHaveBeenCalledWith("leave-room");
      });
    });

    describe("with the disconnect message", () => {
      it("emits the disconnect message", async () => {
        const message = { key: "disconnect" };
        await new Promise((resolve) => {
          socket
            .pipe(split2(JSON.parse))
            .on("data", ({ key, type }) => {
              if (key === message.key && type === "ACK") {
                resolve();
              }
            });

          socket.write(`${JSON.stringify(message)}\n`);
        });

        expect(client.emitter.emit)
          .toHaveBeenCalledTimes(1);

        expect(client.emitter.emit)
          .toHaveBeenCalledWith("disconnect");
      });
    });

    describe("with the game event message with the game data", () => {
      it("emits the game event message", async () => {
        const message = {
          key: "game-event",
          data: {
            gameItem1: 1,
            gameItem2: "two",
            moreItems: ["a", "b", "c"],
            last: {
              finalThing: true,
            },
          },
        };

        await new Promise((resolve) => {
          socket
            .pipe(split2(JSON.parse))
            .on("data", ({ key, type }) => {
              if (key === message.key && type === "ACK") {
                resolve();
              }
            });

          socket.write(`${JSON.stringify(message)}\n`);
        });

        expect(client.emitter.emit)
          .toHaveBeenCalledTimes(1);

        expect(client.emitter.emit)
          .toHaveBeenCalledWith("game-event", message.data);
      });
    });

    describe("with the join game message", () => {
      it("emits the join game message", async () => {
        const message = {
          key: "join-game",
          data: {
            clientId: socket.id,
            roomId: uuidv4(),
          },
        };

        await new Promise((resolve) => {
          socket
            .pipe(split2(JSON.parse))
            .on("data", ({ key, type }) => {
              if (key === message.key && type === "ACK") {
                resolve();
              }
            });

          socket.write(`${JSON.stringify(message)}\n`);
        });

        expect(client.emitter.emit)
          .toHaveBeenCalledTimes(1);

        expect(client.emitter.emit)
          .toHaveBeenCalledWith("join-game", message.data);
      });
    });
  });
});
