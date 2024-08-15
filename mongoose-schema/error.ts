export class ValidationError extends Error {
    constructor(m: string) {
        super(m);
        Object.setPrototypeOf(this, ValidationError.prototype);
    }

}

export class ReferentialError extends Error {
    constructor(m: string) {
        super(m);
        Object.setPrototypeOf(this, ReferentialError.prototype);
    }

}

export class OperationError extends Error {
    constructor(m: string) {
        super(m);
        Object.setPrototypeOf(this, ReferentialError.prototype);
    }

}