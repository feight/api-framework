/* Experimental */

import { ShapeBase } from "@lib/shape";

type IO = ShapeBase<any>;

interface CommandInterface<I extends IO, O extends IO> {
    //@
    route: string;
    permission: string;
    description: string;
    input: I;
    output: O;

    handle(handler: CommandHandler<I, O>): void;
}

/*
 * Command factory class, one instance of this class should be created per command
 * This will contain all information to be able to create a new instance
 * of a handler (CommandHandler)
 */
export class Command<I extends IO, O extends IO> {
    //@
    definition: CommandInterface<I, O>;

    constructor(definition: CommandInterface<I, O>) {
        this.definition = definition;

        // Add to global registry
    }

    getRoutePath(): string {
        return `${this.definition.route}`;
    }

    allowRun(domain: string): boolean {
        return false;
    }

    isAuthorized(): boolean {
        return true;
    }

    run() {
        if (!this.isAuthorized()) {
            throw new Error();
        }

        const handler = new CommandHandler(this.definition);

        handler.invoke();
    }
}

class CommandHandlerBase {
    //@
    definition: CommandInterface<any, any>;

    constructor(definition: CommandInterface<any, any>) {
        this.definition = definition;
    }

    args!: this["definition"]["input"]["data"];

    result!: this["definition"]["output"]["data"];

    invoke() {
        this.definition.handle(this);
    }

    dispose() {
        // Cleanup connections...
    }
}

class CommandHandler<I extends IO, O extends IO> extends CommandHandlerBase {
    //@
    override definition!: CommandInterface<I, O>;
}
