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

    // socket event handlers
    // TODO figure out what these need to do
    [
      "close",
      "connect",
      "data",
      "drain",
      "end",
      "error",
      "lookup",
      "ready",
      "timeout",
    ].forEach((event) => this.socket.on(event, () => {}));
  }

  get id() {
    return this.socket.id;
  }

  notify({ message = {} }) {
    const response = {
      clientId: this.socket.id,
      message,
    };

    if (this.socket.destroyed) {
      response.error = "Client socket was closed";
      return response;
    }

    try {
      message.id = this.socket.id;
      this.socket.write(`${JSON.stringify(message)}\n`);
    } catch (error) {
      response.error = error.message;
    }

    return response;
  }
}
