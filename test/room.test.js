import { v4 as uuidv4 } from "uuid";
import Room from "../src/room";

const isValidId = ({ id }) => (
  new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i)
    .test(id)
);

describe("Room", () => {
  it("isValidId enforces id format", async () => {
    expect(Room.isValidId({ id: uuidv4() })).toBe(true);
  });

  it("toJSON returns the room json", async () => {
    const room = new Room({ name: "test room" });
    const { id, name, clients } = room;
    expect(room.toJSON()).toEqual({ id, name, clients });
  });

  describe("when creating a room", () => {
    it("creates a new room with an id", async () => {
      const { id } = new Room();
      expect(isValidId({ id })).toBe(true);
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
      client1 = { id: uuidv4(), notify: jest.fn(() => true) };
      client2 = { id: uuidv4(), notify: jest.fn(() => true) };
      client3 = { id: uuidv4(), notify: jest.fn(() => false) };
      client4 = { id: uuidv4(), notify: jest.fn(() => true) };
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
        expect(currentClients).toHaveLength(1);

        currentClients = defaultRoom.addClient({ client: client2 });
        expect(currentClients).toHaveLength(2);

        currentClients = defaultRoom.addClient({ client: client3 });
        expect(currentClients).toHaveLength(3);

        currentClients = defaultRoom.addClient({ client: client4 });
        expect(currentClients).toHaveLength(4);
        expect(currentClients).toEqual(
          expect.arrayContaining([client1]),
        );
        expect(currentClients).toEqual(
          expect.arrayContaining([client2]),
        );
        expect(currentClients).toEqual(
          expect.arrayContaining([client3]),
        );
        expect(currentClients).toEqual(
          expect.arrayContaining([client4]),
        );
      });

      it("sends a room-greeting to the client by default", async () => {
        defaultRoom.addClient({ client: client1 });
        expect(client1.notify).toHaveBeenCalledTimes(1);
      });

      it("skips the room-greeting when sendGreeting is false", async () => {
        defaultRoom.addClient({ client: client1, sendGreeting: false });
        expect(client1.notify).toHaveBeenCalledTimes(0);
      });
    });

    describe("using removeClient", () => {
      it("removes the client from the room by id", async () => {
        defaultRoom.addClient({ client: client1 });
        defaultRoom.addClient({ client: client2 });
        defaultRoom.addClient({ client: client3 });
        expect(defaultRoom.clients).toHaveLength(3);

        defaultRoom.removeClient({ id: client2.id });
        expect(defaultRoom.clients).toHaveLength(2);
        expect(defaultRoom.clients).toEqual(
          expect.arrayContaining([client1]),
        );
        expect(defaultRoom.clients).toEqual(
          expect.arrayContaining([client3]),
        );
      });

      it("returns the full list of current clients", async () => {
        expect(defaultRoom.clients).toHaveLength(0);

        defaultRoom.addClient({ client: client1 });
        defaultRoom.addClient({ client: client2 });
        defaultRoom.addClient({ client: client3 });
        defaultRoom.addClient({ client: client4 });
        expect(defaultRoom.clients).toHaveLength(4);

        let currentClients = defaultRoom.removeClient({ id: client1.id });
        expect(currentClients).toHaveLength(3);

        currentClients = defaultRoom.removeClient({ id: client2.id });
        expect(currentClients).toHaveLength(2);

        currentClients = defaultRoom.removeClient({ id: client3.id });
        expect(currentClients).toHaveLength(1);

        currentClients = defaultRoom.removeClient({ id: client4.id });
        expect(currentClients).toHaveLength(0);
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

        const message = { id: uuidv4(), key: "test-key", data: "test-data" };
        notificationRoom.notifyClients({ message });

        expect(client1.notify).toHaveBeenLastCalledWith({ message });
        expect(client2.notify).toHaveBeenLastCalledWith({ message });
        expect(client3.notify).toHaveBeenLastCalledWith({ message });
        expect(client4.notify).toHaveBeenLastCalledWith({ message });
      });

      it("returns an array indicating notification results", async () => {
        expect(notificationRoom.clients).toHaveLength(4);

        const message = { id: uuidv4(), key: "test-key", data: "test-data" };
        const results = notificationRoom.notifyClients({ message });

        expect(results).toHaveLength(4);
        expect(results).toEqual(
          expect.arrayContaining([{ id: client1.id, notified: true, message }]),
        );
        expect(results).toEqual(
          expect.arrayContaining([{ id: client2.id, notified: true, message }]),
        );
        expect(results).toEqual(
          expect.arrayContaining([{ id: client3.id, notified: false, message }]),
        );
        expect(results).toEqual(
          expect.arrayContaining([{ id: client4.id, notified: true, message }]),
        );
      });

      it("only notifies the clients specified", async () => {
        expect(notificationRoom.clients).toHaveLength(4);

        const message = { id: uuidv4(), key: "test-key", data: "test-data" };
        notificationRoom.notifyClients({
          message,
          clients: [client1, client3, client4],
        });

        expect(client1.notify).toHaveBeenLastCalledWith({ message });
        expect(client3.notify).toHaveBeenLastCalledWith({ message });
        expect(client4.notify).toHaveBeenLastCalledWith({ message });
        expect(client2.notify).not.toHaveBeenLastCalledWith({ message });
      });
    });
  });
});
