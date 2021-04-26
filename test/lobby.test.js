import { v4 as uuidv4 } from "uuid";
import Client from "../src/client";
import Lobby from "../src/lobby";
import { keys as messageKeys } from "../src/messages";

const fakeSocket = () => ({
  id: uuidv4(),
  write: jest.fn(() => true),
  on: jest.fn(),
  removeAllListeners: () => {},
  pipe: () => ({ on: jest.fn() }),
});

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
        new Client({ socket: fakeSocket() }),
        new Client({ socket: fakeSocket() }),
        new Client({ socket: fakeSocket() }),
        new Client({ socket: fakeSocket() }),
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
        new Client({ socket: fakeSocket() }),
        new Client({ socket: fakeSocket() }),
        new Client({ socket: fakeSocket() }),
        new Client({ socket: fakeSocket() }),
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
      const spies = clients.map((client) => jest.spyOn(client, "notify"));

      lobby.removeRoom(room);

      spies.forEach((spy) => expect(spy).toHaveBeenCalledWith({
        message: {
          key: messageKeys.ROOM_CLOSING,
          room: room.toJSON(),
        },
      }));
    });
  });

  describe("when handling room events", () => {
    let clients;
    let lobby;
    beforeEach(() => {
      lobby = new Lobby();
      clients = [
        new Client({ socket: fakeSocket() }),
        new Client({ socket: fakeSocket() }),
        new Client({ socket: fakeSocket() }),
        new Client({ socket: fakeSocket() }),
      ];
    });

    describe("getting the remove client message", () => {
      it("adds the removed client back into the lobby's client list", async () => {
        const addClientSpy = jest.spyOn(lobby, "addClient");
        const room = lobby.createRoom({
          name: "test-room",
          clients,
        });

        room
          .emitter
          .emit("removed-client", clients[0]);

        expect(addClientSpy)
          .toHaveBeenCalledWith({ client: clients[0] });
      });
    });

    describe("getting the disconnect client message", () => {
      it("emits the disconnect client message", async () => {
        const lobbyEmitterSpy = jest.spyOn(lobby.emitter, "emit");
        const room = lobby.createRoom({
          name: "test-room",
          clients,
        });

        room
          .emitter
          .emit("disconnect-client", clients[0]);

        expect(lobbyEmitterSpy)
          .toHaveBeenCalledWith("disconnect-client", clients[0]);
      });
    });
  });
});
