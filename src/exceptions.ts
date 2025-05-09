export class DynamormException extends Error {
  constructor(message) {
    super(message);
  }
}

export class PrimaryKeyException extends DynamormException {
  constructor(message: string | string[]) {
    if (message instanceof Array) {
      message = message.join('\n')
    }
    super(message);
  }
}

export class ServiceUnavailableException extends DynamormException {
  constructor(message) {
    super(message);
  }
}

export class TableNotFoundException extends DynamormException {
  constructor(message) {
    super(message);
  }
}

export class QueryException extends DynamormException {
  constructor(message) {
    super(message);
  }
}

export class ValidationError extends DynamormException {
  constructor(public messages: string[]) {
    super(messages);
  }
}
