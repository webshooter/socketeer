import net from "net";
import { v4 as uuidv4 } from "uuid";
import Client from "../src/client";
import messages, { keys } from "../src/messages";
import Room from "../src/room";

describe("messages", () => {
  let client;
  let error;
  let room;

  beforeEach(() => {
    const socket = new net.Socket();
    socket.id = uuidv4();
    client = new Client({ socket });
    error = "error message";
    room = new Room({ name: "the room" });
    [
      new net.Socket(),
      new net.Socket(),
      new net.Socket(),
    ].forEach((s) => {
      s.id = uuidv4();
      room.addClient({ client: new Client({ socket: s }) });
    });
  });

  describe("SERVER_GREET", () => {
    it("returns the message", async () => {
      const expected = { key: "server-greet", id: client.id };
      const message = messages.get(keys.SERVER_GREET);

      expect(message({ client })).toEqual(expected);
    });

    it("includes the error message when provided", async () => {
      const expected = {
        key: keys.SERVER_GREET,
        id: client.id,
        error,
      };
      const message = messages.get(keys.SERVER_GREET);

      expect(message({ client, error })).toEqual(expected);
    });
  });

  describe("ROOM_GREET", () => {
    it("returns the message", async () => {
      const expected = {
        key: keys.ROOM_GREET,
        id: client.id,
        room: room.toJSON(),
      };
      const message = messages.get(keys.ROOM_GREET);

      expect(message({ client, room })).toEqual(expected);
    });

    it("includes the error message when provided", async () => {
      const expected = {
        key: keys.ROOM_GREET,
        id: client.id,
        room: room.toJSON(),
        error,
      };
      const message = messages.get(keys.ROOM_GREET);

      expect(message({ client, room, error })).toEqual(expected);
    });
  });
});
