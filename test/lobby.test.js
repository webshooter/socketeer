import { v4 as uuidv4 } from "uuid";
import Lobby from "../src/lobby";
import { keys as messageKeys } from "../src/messages";

describe("Lobby", () => {
  describe("initializing ", () => {
    it("creates the lobby", async () => {
      const lobby = new Lobby();
      expect(lobby.name).toBe("LOBBY");
    });
  });

  describe("createRoom", () => {
    it("creates a new empty room in the rooms list", async () => {
      const lobby = new Lobby();
      expect(lobby.rooms).toHaveLength(0);

      lobby.createRoom();
      expect(lobby.rooms).toHaveLength(1);

      lobby.createRoom();
      expect(lobby.rooms).toHaveLength(2);
    });

    it("creates a new room with the provided clients", async () => {
      const lobby = new Lobby();
      expect(lobby.rooms).toHaveLength(0);

      const clients = [
        { id: uuidv4(), notify: jest.fn(() => true) },
        { id: uuidv4(), notify: jest.fn(() => true) },
        { id: uuidv4(), notify: jest.fn(() => true) },
        { id: uuidv4(), notify: jest.fn(() => true) },
      ];

      const room = lobby.createRoom({ clients });
      expect(lobby.rooms).toHaveLength(1);

      expect(room.clients).toHaveLength(4);
      clients.forEach((client) => expect(room.clients).toEqual(
        expect.arrayContaining([client]),
      ));
    });
  });

  describe("removeRoom", () => {
    let lobby;
    let clients;
    let room;
    beforeEach(() => {
      lobby = new Lobby();
      clients = [
        { id: uuidv4(), notify: jest.fn(() => true) },
        { id: uuidv4(), notify: jest.fn(() => true) },
        { id: uuidv4(), notify: jest.fn(() => true) },
        { id: uuidv4(), notify: jest.fn(() => true) },
      ];
      lobby.createRoom();
      // create 2 rooms with clients to ensure
      // the notify only goes out once
      lobby.createRoom({ clients });
      room = lobby.createRoom({ clients });
    });

    it("removes the room from the room list", async () => {
      expect(lobby.rooms).toHaveLength(3);

      const remainingRooms = lobby.removeRoom(room);
      expect(remainingRooms).toHaveLength(2);
      expect(lobby.rooms).toHaveLength(2);

      lobby.rooms.forEach((r) => {
        expect(r.id).not.toBe(room.id);
      });
    });

    it("notifies room clients with room close message", async () => {
      lobby.removeRoom(room);
      clients
        .forEach((client) => expect(client.notify).toHaveBeenLastCalledWith({
          message: {
            key: messageKeys.ROOM_CLOSING,
            room: room.toJSON(),
          },
        }));
    });
  });
});
