export declare class DynamormException extends Error {
    constructor(message: any);
}
export declare class TableNotFoundException extends DynamormException {
    constructor(message: any);
}
export declare class ServiceUnavailableException extends DynamormException {
    constructor(message: any);
}
export declare class PrimaryKeyException extends DynamormException {
    constructor(message: any);
}
export declare class ValidationError extends DynamormException {
    messages: string[];
    constructor(messages: string[]);
}
//# sourceMappingURL=exceptions.d.ts.map