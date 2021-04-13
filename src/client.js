const idRegEx = new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);

export default class Client {
  static isValidId({ id }) {
    return idRegEx.test(id);
  }

  constructor({ socket }) {
    if (!socket || !Client.isValidId(socket)) {
      throw new Error("Client requires a valid socket!");
    }

    this.socket = socket;
  }

  get id() {
    return this.socket.id;
  }

  notify({ message }) {
    if (message) {
      this.socket.write(JSON.stringify(message));
    }
  }
}
