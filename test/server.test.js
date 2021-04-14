import net from "net";
import Server from "../src/server";

describe("server", () => {
  let port;
  let eventHandlers;
  beforeEach(() => {
    port = 3333;
    eventHandlers = new Map();
    eventHandlers.set("connection", jest.fn(/*() => console.log("CONNECTION")*/));
    eventHandlers.set("listening", jest.fn(/*() => console.log("LISTENING")*/));
    eventHandlers.set("close", jest.fn());
    eventHandlers.set("error", jest.fn());
  });

  describe("event-handling", () => {
    let server;
    let client;
    beforeEach(() => {
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
