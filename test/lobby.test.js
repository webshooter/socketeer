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

const sortById = (array) => array.sort((a, b) => a.id - b.id);

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

      expect(sortById(room.clients)).toEqual(sortById(clients));
    });

    it("removes provided clients from it's list of clients", async () => {
      const lobby = new Lobby();
      expect(lobby.rooms).toHaveLength(0);

      const clients = [
        new Client({ socket: fakeSocket() }),
        new Client({ socket: fakeSocket() }),
        new Client({ socket: fakeSocket() }),
        new Client({ socket: fakeSocket() }),
      ];

      clients.forEach((client) => lobby.addClient({ client }));
      expect(lobby.clients).toHaveLength(4);

      const room = lobby.createRoom({ clients });
      expect(lobby.rooms).toHaveLength(1);
      expect(lobby.clients).toHaveLength(0);
      expect(sortById(room.clients)).toEqual(sortById(clients));
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

  describe("joinRoom", () => {
    it("joins the room specified in the game data if it exists", async () => {
      const lobby = new Lobby();
      const existingRoom = lobby.createRoom();
      const client = new Client({ socket: fakeSocket() });
      const addClientSpy = jest.spyOn(existingRoom, "addClient");

      lobby.joinRoom({ client, data: { roomId: existingRoom.id } });
      expect(addClientSpy).toHaveBeenCalledWith({ client });
    });

    it("returns the room after client has joined", async () => {
      const lobby = new Lobby();
      const existingRoom = lobby.createRoom();
      const client = new Client({ socket: fakeSocket() });

      expect(existingRoom.clientCount).toEqual(0);

      const updatedRoom = lobby.joinRoom({
        client,
        data: { roomId: existingRoom.id },
      });
      expect(updatedRoom.id).toEqual(existingRoom.id);
      expect(existingRoom.clientCount).toEqual(1);
    });

    it("sends the room-not-found message if the room isn't found", async () => {
      const lobby = new Lobby();
      const client = new Client({ socket: fakeSocket() });
      const notifyClientsSpy = jest.spyOn(lobby, "notifyClients");
      const roomId = uuidv4();

      lobby.createRoom();
      lobby.joinRoom({ client, data: { roomId } });

      expect(notifyClientsSpy).toHaveBeenCalledWith({
        message: { key: messageKeys.ROOM_NOT_FOUND, roomId },
        clients: [client],
      });
    });

    it("joins the first available room waiting for a new player", async () => {
      const lobby = new Lobby();
      const waitingClient = new Client({ socket: fakeSocket() });
      const newClient = new Client({ socket: fakeSocket() });

      // make an empty room to make sure the code find the right room
      const fullRoom = lobby.createRoom({
        clients: [
          new Client({ socket: fakeSocket() }),
          new Client({ socket: fakeSocket() }),
        ],
      });

      // create a room and add a client
      const room = lobby.createRoom({ clients: [waitingClient] });
      const addClientSpy = jest.spyOn(room, "addClient");

      expect(fullRoom.clientCount).toEqual(2);
      expect(room.clientCount).toEqual(1);

      const resultRoom = lobby.joinRoom({ client: newClient });

      expect(fullRoom.clientCount).toEqual(2);
      expect(resultRoom.id).toEqual(room.id);
      expect(resultRoom.clientCount).toEqual(2);
      expect(addClientSpy).toHaveBeenCalledWith({ client: newClient });
    });

    it("creates and joins a new room when no rooms are waiting for players", async () => {
      const client = new Client({ socket: fakeSocket() });

      const lobby = new Lobby();
      expect(lobby.rooms).toHaveLength(0);

      // make an empty room to make sure the code find the right room
      const fullRoom = lobby.createRoom({
        clients: [
          new Client({ socket: fakeSocket() }),
          new Client({ socket: fakeSocket() }),
        ],
      });
      expect(fullRoom.clientCount).toEqual(2);
      expect(lobby.rooms).toEqual([fullRoom]);

      const resultRoom = lobby.joinRoom({ client });

      expect(fullRoom.clientCount).toEqual(2);
      expect(resultRoom.id).not.toEqual(fullRoom.id);
      expect(resultRoom.clients).toEqual([client]);
      expect(sortById(lobby.rooms)).toEqual(sortById([fullRoom, resultRoom]));
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
