import { v4 as uuidv4 } from "uuid";
import Client from "../src/client";

describe("Client", () => {
  const socket1 = { id: uuidv4() };

  it("isValidId enforces id format", async () => {
    expect(Client.isValidId({ id: uuidv4() })).toBe(true);
  });

  describe("when creating a new client", () => {
    it("throws an error is no socket is provided", async () => {
      expect(() => new Client({}))
        .toThrow("Client requires a valid socket!");
    });

    it("returns a client with a valid id", async () => {
      expect(Client.isValidId(new Client({ socket: socket1 }))).toBe(true);
    });

    it("attached the provided socket to the client", async () => {
      const client = new Client({ socket: socket1 });
      expect(client.socket).toMatchObject(socket1);
    });
  });

  describe("when sending notifications", () => {
    it("passes the message to the socket's write method", async () => {
      const fakeSocket = {
        id: uuidv4(),
        write: jest.fn(),
      };

      const message = { id: uuidv4(), key: "test-key", data: "test-data" };
      const client = new Client({ socket: fakeSocket });
      client.notify({ message });

      expect(fakeSocket.write).toHaveBeenCalledTimes(1);
    });
  });
});
