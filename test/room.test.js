import { v4 as uuidv4 } from "uuid";
import Room from "../src/room";
import Client from "../src/client";
import messages, { keys as messageKeys } from "../src/messages";

const isValidId = ({ id }) => (
  new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i)
    .test(id)
);

const fakeSocket = () => ({
  id: uuidv4(),
  write: jest.fn(() => true),
  on: jest.fn(),
  removeAllListeners: () => {},
  pipe: () => ({ on: jest.fn() }),
});

const sortById = (array) => array.sort((a, b) => a.id - b.id);

describe("Room", () => {
  it("isValidId enforces id format", async () => {
    expect(Room.isValidId({ id: uuidv4() })).toBe(true);
  });

  it("toJSON returns the room json", async () => {
    const room = new Room({ name: "test room" });
    const {
      id,
      createdAt,
      name,
      clients,
    } = room;
    expect(room.toJSON()).toEqual({
      id,
      createdAt,
      name,
      clients,
    });
  });

  describe("clientCount", () => {
    it("returns the number of current cllients in the room", async () => {
      const room = new Room();
      const clients = [
        new Client({ socket: fakeSocket() }),
        new Client({ socket: fakeSocket() }),
        new Client({ socket: fakeSocket() }),
        new Client({ socket: fakeSocket() }),
        new Client({ socket: fakeSocket() }),
      ];
      clients.forEach((client) => room.addClient({ client }));

      expect(room.clientCount).toEqual(clients.length);
    });
  });

  describe("when creating a room", () => {
    it("creates a new room with an id", async () => {
      const { id } = new Room();
      expect(isValidId({ id })).toBe(true);
    });

    it("creates a new room with a created at timestamp", async () => {
      const { createdAt } = new Room();
      expect(createdAt).toBeLessThanOrEqual(Date.now());
    });

    it("creates a new room with a default name", async () => {
      const { id, name } = new Room();
      expect(name).toEqual(`[${id}]`);
    });

    it("creates a new room using the provided name", async () => {
      const { name } = new Room({ name: "Test Room" });
      expect(name).toEqual("Test Room");
    });

    it("uses the default room name if provdided name is invalid", async () => {
      const { id, name } = new Room({ name: null });
      expect(name).toEqual(`[${id}]`);
    });

    it("creates a room with no clients", async () => {
      const room = new Room();
      expect(room.clients).toMatchObject([]);
    });
  });

  describe("when managing clients", () => {
    let client1;
    let client2;
    let client3;
    let client4;

    let defaultRoom;
    beforeEach(() => {
      defaultRoom = new Room();

      client1 = new Client({ socket: fakeSocket() });
      client2 = new Client({ socket: fakeSocket() });
      client3 = new Client({ socket: fakeSocket() });
      client4 = new Client({ socket: fakeSocket() });
    });

    describe("using addClient", () => {
      it("adds a client to the room", async () => {
        expect(defaultRoom.clients).toMatchObject([]);

        defaultRoom.addClient({ client: client1 });
        expect(defaultRoom.clients).toMatchObject([client1]);

        defaultRoom.addClient({ client: client2 });
        expect(defaultRoom.clients).toHaveLength(2);
        expect(defaultRoom.clients).toEqual(
          expect.arrayContaining([client1]),
        );
        expect(defaultRoom.clients).toEqual(
          expect.arrayContaining([client2]),
        );
      });

      it("returns the full list of current clients", async () => {
        expect(defaultRoom.clients).toHaveLength(0);

        let currentClients = defaultRoom.addClient({ client: client1 });
        expect(sortById(currentClients))
          .toEqual(sortById([client1]));

        currentClients = defaultRoom.addClient({ client: client2 });
        expect(sortById(currentClients))
          .toEqual(sortById([client1, client2]));

        currentClients = defaultRoom.addClient({ client: client3 });
        expect(sortById(currentClients))
          .toEqual(sortById([client1, client2, client3]));

        currentClients = defaultRoom.addClient({ client: client4 });
        expect(sortById(currentClients))
          .toEqual(sortById([client1, client2, client3, client4]));
      });

      it("sends a room-greeting to the client by default", async () => {
        const notifySpy = jest.spyOn(client1, "notify");
        defaultRoom.addClient({ client: client1 });
        expect(notifySpy).toHaveBeenCalledTimes(1);
      });

      it("skips the room-greeting when sendGreeting is false", async () => {
        const notifySpy = jest.spyOn(client1, "notify");
        defaultRoom.addClient({ client: client1, sendGreeting: false });
        expect(notifySpy).toHaveBeenCalledTimes(0);
      });

      it("sends a new player greeting to only the other clients in the room", async () => {
        const otherClients = [client1, client2, client3];
        otherClients.forEach((client) => defaultRoom.addClient({ client }));

        const spies = otherClients.map((client) => jest.spyOn(client, "notify"));
        const newClientSpy = jest.spyOn(client4, "notify");

        defaultRoom.addClient({ client: client4 });

        const message = messages
          .get(messageKeys.NEW_PLAYER)({
            client: client4,
            room: defaultRoom,
          });

        spies.forEach((spy) => {
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy).toHaveBeenCalledWith({ message });
        });

        expect(newClientSpy).not.toHaveBeenCalledWith({ message });
      });
    });

    describe("using removeClient", () => {
      it("removes the client from the room by id", async () => {
        defaultRoom.addClient({ client: client1 });
        defaultRoom.addClient({ client: client2 });
        defaultRoom.addClient({ client: client3 });
        expect(sortById(defaultRoom.clients))
          .toEqual(sortById([client1, client2, client3]));

        defaultRoom.removeClient({ id: client2.id });
        expect(sortById(defaultRoom.clients))
          .toEqual(sortById([client1, client3]));
      });

      it("returns the full list of current clients", async () => {
        expect(defaultRoom.clients).toHaveLength(0);

        defaultRoom.addClient({ client: client1 });
        defaultRoom.addClient({ client: client2 });
        defaultRoom.addClient({ client: client3 });
        defaultRoom.addClient({ client: client4 });

        expect(sortById(defaultRoom.clients))
          .toEqual(sortById([client1, client2, client3, client4]));

        expect(sortById(defaultRoom.removeClient({ id: client1.id })))
          .toEqual(sortById([client2, client3, client4]));

        expect(sortById(defaultRoom.removeClient({ id: client2.id })))
          .toEqual(sortById([client3, client4]));

        expect(sortById(defaultRoom.removeClient({ id: client3.id })))
          .toEqual(sortById([client4]));

        expect(sortById(defaultRoom.removeClient({ id: client4.id })))
          .toEqual(sortById([]));
      });
    });

    describe("using notifyClients", () => {
      let notificationRoom;
      beforeEach(() => {
        notificationRoom = new Room();
        notificationRoom.addClient({ client: client1 });
        notificationRoom.addClient({ client: client2 });
        notificationRoom.addClient({ client: client3 });
        notificationRoom.addClient({ client: client4 });
      });

      it("sends the messsage to all clients in the room by default", async () => {
        expect(notificationRoom.clients).toHaveLength(4);

        const notifySpyClient1 = jest.spyOn(client1, "notify");
        const notifySpyClient2 = jest.spyOn(client2, "notify");
        const notifySpyClient3 = jest.spyOn(client3, "notify");
        const notifySpyClient4 = jest.spyOn(client4, "notify");

        const message = { id: uuidv4(), key: "test-key", data: "test-data" };
        notificationRoom.notifyClients({ message });

        expect(notifySpyClient1).toHaveBeenLastCalledWith({ message });
        expect(notifySpyClient2).toHaveBeenLastCalledWith({ message });
        expect(notifySpyClient3).toHaveBeenLastCalledWith({ message });
        expect(notifySpyClient4).toHaveBeenLastCalledWith({ message });
      });

      it("returns an array indicating notification results", async () => {
        expect(notificationRoom.clients).toHaveLength(4);

        notificationRoom.clients.forEach((client) => {
          client.notify = jest.fn(() => true);
        });
        client3.notify = jest.fn(() => false);

        const message = { id: uuidv4(), key: "test-key", data: "test-data" };

        expect(sortById(notificationRoom.notifyClients({ message })))
          .toEqual(sortById([
            { id: client1.id, notified: true, message },
            { id: client2.id, notified: true, message },
            { id: client3.id, notified: false, message },
            { id: client4.id, notified: true, message },
          ]));
      });

      it("only notifies the clients specified", async () => {
        expect(notificationRoom.clients).toHaveLength(4);

        const notifySpyClient1 = jest.spyOn(client1, "notify");
        const notifySpyClient2 = jest.spyOn(client2, "notify");
        const notifySpyClient3 = jest.spyOn(client3, "notify");
        const notifySpyClient4 = jest.spyOn(client4, "notify");

        const message = { id: uuidv4(), key: "test-key", data: "test-data" };
        notificationRoom.notifyClients({
          message,
          clients: [client1, client3, client4],
        });

        expect(notifySpyClient1).toHaveBeenLastCalledWith({ message });
        expect(notifySpyClient3).toHaveBeenLastCalledWith({ message });
        expect(notifySpyClient4).toHaveBeenLastCalledWith({ message });

        expect(notifySpyClient2).not.toHaveBeenLastCalledWith({ message });
      });
    });
  });

  describe("when handling events", () => {
    it("removes clients on leave-room event from client", async () => {
      const client = new Client({ socket: fakeSocket() });
      const room = new Room();
      expect(room.clients).toHaveLength(0);

      room.addClient({ client });
      expect(room.clients).toHaveLength(1);
      expect(room.clients[0].id).toBe(client.id);

      client.emitter.emit("leave-room");
      expect(room.clients).toHaveLength(0);
    });

    it("removes any existing leave-room listeners from the client", async () => {
      const client = new Client({ socket: fakeSocket() });
      const room = new Room();

      const removeAllListenersSpy = jest.spyOn(client.emitter, "removeAllListeners");

      room.addClient({ client });
      client.emitter.emit("leave-room");

      expect(removeAllListenersSpy)
        .toHaveBeenCalledWith("leave-room");
    });

    it("emits the remove-client event", async () => {
      const client = new Client({ socket: fakeSocket() });
      const room = new Room();

      room.emitter = {
        emit: jest.fn(),
      };

      room.addClient({ client });
      client.emitter.emit("leave-room");

      expect(room.emitter.emit)
        .toHaveBeenCalledWith("remove-client", client);
    });

    it("sends the game data event data to other clients in the room", async () => {
      const otherClients = [
        new Client({ socket: fakeSocket() }),
        new Client({ socket: fakeSocket() }),
        new Client({ socket: fakeSocket() }),
        new Client({ socket: fakeSocket() }),
      ];
      const client = new Client({ socket: fakeSocket() });
      const room = new Room();
      const gameData = {
        clientId: client.id,
        event: {
          key: "jump",
          position: {
            x: 123,
            y: 321,
          },
        },
      };

      otherClients.forEach((c) => room.addClient({ client: c }));
      room.addClient({ client });

      const notifyClientSpy = jest.spyOn(room, "notifyClients");

      client.emitter.emit("game-event", gameData);

      expect(notifyClientSpy)
        .toHaveBeenCalledTimes(1);

      expect(notifyClientSpy)
        .toHaveBeenCalledWith({
          message: gameData,
          clients: otherClients,
        });
    });
  });
});
