import net from "net";
import { v4 as uuidv4 } from "uuid";
import Client from "../src/client";

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
      const message = { id: uuidv4(), key: "test-key", data: "test-dataX" };
      const client = new Client({ socket });
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
});
