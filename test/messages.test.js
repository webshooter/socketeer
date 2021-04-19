import messages from "../src/messages";

describe("messages", () => {
  const client = { id: "12345" };
  const error = "error message";
  const room = {
    id: "ABCDE",
    name: "the room",
    clients: [
      client.id,
      "23456",
      "34567",
    ],
  };

  describe("SERVER_GREET", () => {
    it("returns the message", async () => {
      const expected = { key: "server-greet", id: client.id };
      const message = messages.get("SERVER_GREET");

      expect(message({ client })).toEqual(expected);
    });

    it("includes the error message when provided", async () => {
      const expected = {
        key: "server-greet",
        id: client.id,
        error,
      };
      const message = messages.get("SERVER_GREET");

      expect(message({ client, error })).toEqual(expected);
    });
  });

  describe("ROOM_GREET", () => {
    it("returns the message", async () => {
      const expected = {
        key: "server-greet",
        id: client.id,
        room,
      };
      const message = messages.get("ROOM_GREET");

      expect(message({ client, room })).toEqual(expected);
    });
  });

  it("includes the error message when provided", async () => {
    const expected = {
      key: "server-greet",
      id: client.id,
      room,
      error,
    };
    const message = messages.get("ROOM_GREET");

    expect(message({ client, room, error })).toEqual(expected);
  });
});
