"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.PrimaryKeyException = exports.ServiceUnavailableException = exports.TableNotFoundException = exports.DynamormException = void 0;
class DynamormException extends Error {
    constructor(message) {
        super(message);
    }
}
exports.DynamormException = DynamormException;
class TableNotFoundException extends DynamormException {
    constructor(message) {
        super(message);
    }
}
exports.TableNotFoundException = TableNotFoundException;
class ServiceUnavailableException extends DynamormException {
    constructor(message) {
        super(message);
    }
}
exports.ServiceUnavailableException = ServiceUnavailableException;
class PrimaryKeyException extends DynamormException {
    constructor(message) {
        super(message);
    }
}
exports.PrimaryKeyException = PrimaryKeyException;
class ValidationError extends DynamormException {
    messages;
    constructor(messages) {
        super(messages);
        this.messages = messages;
    }
}
exports.ValidationError = ValidationError;
