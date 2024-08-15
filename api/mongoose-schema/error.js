"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationError = exports.ReferentialError = exports.ValidationError = void 0;
class ValidationError extends Error {
    constructor(m) {
        super(m);
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
exports.ValidationError = ValidationError;
class ReferentialError extends Error {
    constructor(m) {
        super(m);
        Object.setPrototypeOf(this, ReferentialError.prototype);
    }
}
exports.ReferentialError = ReferentialError;
class OperationError extends Error {
    constructor(m) {
        super(m);
        Object.setPrototypeOf(this, ReferentialError.prototype);
    }
}
exports.OperationError = OperationError;
