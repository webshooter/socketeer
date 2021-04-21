import net from "net";
import { v4 as uuidv4 } from "uuid";
import Client from "../src/client";
import messages, { keys } from "../src/messages";
import Room from "../src/room";

describe("messages", () => {
  let error;
  let room;

  beforeEach(() => {
    error = "error message";
    room = new Room({ name: "the room" });
  });

  describe("SERVER_GREET", () => {
    it("returns the message", async () => {
      const expected = { key: "server-greet" };
      const message = messages.get(keys.SERVER_GREET);

      expect(message()).toEqual(expected);
    });

    it("includes the error message when provided", async () => {
      const expected = {
        key: keys.SERVER_GREET,
        error,
      };
      const message = messages.get(keys.SERVER_GREET);

      expect(message({ error })).toEqual(expected);
    });
  });

  describe("ROOM_GREET", () => {
    it("returns the message", async () => {
      const expected = {
        key: keys.ROOM_GREET,
        room: room.toJSON(),
      };
      const message = messages.get(keys.ROOM_GREET);

      expect(message({ room })).toEqual(expected);
    });

    it("includes the error message when provided", async () => {
      const expected = {
        key: keys.ROOM_GREET,
        room: room.toJSON(),
        error,
      };
      const message = messages.get(keys.ROOM_GREET);

      expect(message({ room, error })).toEqual(expected);
    });
  });
});
