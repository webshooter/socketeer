import messages, { keys } from "../src/messages";
import Room from "../src/room";

describe("messages", () => {
  let error;
  let room;
  let client;

  beforeEach(() => {
    error = "error message";
    room = new Room({ name: "the room" });
    client = { id: "12345asdf" };
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

  describe("NEW_PLAYER", () => {
    it("sends the new client's id", async () => {
      const expected = {
        key: keys.NEW_PLAYER,
        newPlayerId: client.id,
        room: room.toJSON(),
      };
      const message = messages.get(keys.NEW_PLAYER);

      expect(message({ client, room })).toEqual(expected);
    });
  });
});
