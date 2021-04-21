import net from "net";
import split2 from "split2";
import Server from "../src/server";
import { keys as messageKeys } from "../src/messages";

describe("server", () => {
  let defaultServer;
  let defaultPort;
  let eventHandlers;
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
  });

  afterEach(async () => defaultServer?.close());

  describe("connections", () => {
    it("uses the maxConnections value when provided", async () => {
      const maxConnections = 4;
      const server = new Server({
        port: defaultPort,
        eventHandlers,
        maxConnections,
      });
      expect(server.maxConnections).toBe(maxConnections);
      await server.close();
    });

    it("return the default maxConnections value when not provided", async () => {
      expect(defaultServer.maxConnections).toBeGreaterThan(0);
    });

    it("getConnections returns the current connections count", async () => {
      const sockets = [
        new net.Socket(),
        new net.Socket(),
        new net.Socket(),
      ];

      await defaultServer.listen();
      expect(await defaultServer.getConnections()).toBe(0);

      await Promise.all(sockets
        .map((socket) => new Promise((resolve) => socket.connect(defaultPort, () => resolve()))));

      expect(await defaultServer.getConnections()).toBe(sockets.length);

      sockets.forEach((socket) => socket.end());
    });
  });

  describe("clients", () => {
    it("returns the server greet message upon connection", (done) => {
      const isValidId = ({ id }) => (new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i)).test(id);
      const socket = new net.Socket();
      socket
        .pipe(split2(JSON.parse))
        .on("data", ({ id, key, error }) => {
          if (key === messageKeys.SERVER_GREET) {
            expect(error).toBeUndefined();
            expect(isValidId({ id })).toBe(true);
            socket.end();
            done();
          }
        });

      defaultServer
        .listen()
        .then(() => socket.connect(defaultPort));
    });

    it("adds new clients to the lobby automatically", async () => {
      const socket = new net.Socket();

      await defaultServer.listen();
      expect(defaultServer.lobby.clients).toHaveLength(0);

      await new Promise((resolve) => {
        socket
          .pipe(split2(JSON.parse))
          .on("data", ({ key }) => {
            if (key === messageKeys.SERVER_GREET) { resolve(); }
          });
        socket.connect(defaultPort);
      });

      expect(defaultServer.lobby.clients).toHaveLength(1);

      socket.end();
    });

    it("adds client to client list on connection", async () => {
      const socket = new net.Socket();

      await defaultServer.listen();
      expect(defaultServer.lobby.clients).toHaveLength(0);

      await new Promise((resolve) => {
        socket
          .pipe(split2(JSON.parse))
          .on("data", ({ key }) => {
            if (key === messageKeys.SERVER_GREET) { resolve(); }
          });
        socket.connect(defaultPort);
      });

      expect(defaultServer.lobby.clients).toHaveLength(1);

      socket.end();
    });
  });

  describe("lobby", () => {
    it("creates a lobby on server startup", async () => {
      const { lobby } = defaultServer;
      expect(lobby).not.toBeNull();
      expect(lobby).not.toBeUndefined();
      expect(lobby.name).toBe("LOBBY");
    });
  });

  describe("event-handling", () => {
    let server;
    let client;
    let port;
    beforeEach(() => {
      port = 3331;
      server = new Server({
        port,
        eventHandlers,
      });

      client = new net.Socket();
    });

    afterEach(async () => {
      if (server) {
        await server.close();
      }

      if (client) {
        client.end();
        client.destroy();
      }
    });

    it("invokes the `listening` handler as expected", async () => {
      await server.listen();

      expect(eventHandlers.get("listening"))
        .toHaveBeenCalledTimes(1);
    });

    it("invokes the `connection` handler as expected", async () => {
      await server.listen();
      client.connect(port);

      expect(eventHandlers.get("listening"))
        .toHaveBeenCalledTimes(1);
    });

    it("invokes the `close` handler as expected", async () => {
      await server.listen();

      await server.close();
      expect(eventHandlers.get("close"))
        .toHaveBeenCalledTimes(1);
    });

    it("invokes the `error` handler", async () => {
      await server.listen();

      server.netServer.emit("error", new Error("Test Error"));
      expect(eventHandlers.get("error"))
        .toHaveBeenCalledTimes(1);
    });
  });
});
