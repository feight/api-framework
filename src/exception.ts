export class AppException extends Error {
    //@
    code: number;
    statusCode: number;

    constructor(message: string, code = 0, statusCode = 400) {
        super(message);

        this.code = code;
        this.statusCode = statusCode;
    }

    static throw<T>(this: { new (): T }): never {
        throw new this();
    }

    static base(message: string, code = 0, statusCode = 400) {
        return class extends AppException {
            constructor(m?: string) {
                super(m ?? message, code, statusCode);
            }
        };
    }
}
