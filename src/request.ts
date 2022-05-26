import { ShapeBase } from "@lib/shape";
import { UserContext } from "@lib/context";
import { AppException } from "@lib/exception";
import ErrorShape from "@lib/base/shapes/error/error";

export type IO = ShapeBase<any>;

export abstract class RequestContext {
    ipAddress: string;
    hostName: string;
    payload: any;
    context: UserContext;

    constructor(args: { ipAddress: string; hostName: string; payload: any; context: UserContext }) {
        this.ipAddress = args.ipAddress;
        this.hostName = args.hostName;
        this.payload = args.payload;
        this.context = args.context;
    }

    abstract status(code: number): void;

    abstract setCookie(name: string, value: string): void;
}

export interface HandlerInterface<I extends IO, O extends IO> {
    //@
    route: string;
    permission: string;
    description: string;
    input: I;
    output: O;
    options?: {
        admin: boolean;
    };
}

abstract class HandlerBase {
    //@
    abstract definition: HandlerInterface<any, any>;

    response: any;
    context!: UserContext;
    request!: RequestContext;
    args!: this["definition"]["input"]["data"];
    result!: this["definition"]["output"]["data"];

    abstract handle(): Promise<void>;

    async dispose() {}
    async onSuccess() {}
    async onException(error: any) {}
    async onAuthentication(context: UserContext) {}

    async run(request: RequestContext) {
        //@
        this.request = request;

        /////////////////////

        this.context = this.request.context;

        // this.context = new UserContext({ ipAddress: "::", accessToken: "12345" });

        await this.onAuthentication(this.context);

        // self.validate_module()
        // self.authorize()
        // self.before_run()  # TODO: make this before_handle rather
        // self.params = self._get_arguments()
        // self.origin = self.context.origin

        // # delegate to another service if needed
        // # ...
        // module_reroute = None
        // module_path = self.__module__ + '.' + self.__class__.__name__

        ////////////////////

        // this.context = request.context;
        //
        try {
            // run
            this.args = this.definition.input.parse(request.payload);

            await this.handle();

            if (this.result) {
                //
                this.response = this.definition.output.parse(this.result);
            } else {
                this.response = this.success();
            }

            //
            await this.onSuccess();
            //
        } catch (error: any) {
            await this.onException(error);
            //
            this.request.status(500);

            this.response = await this.getErrorResponse(error);
            //
        } finally {
            //
            // await this.services.da.close();
        }
    }

    success(message?: string) {
        return { success: message ?? true };
    }

    async getErrorResponse(error: any) {
        let code = 0;
        if (error instanceof AppException) {
            code = error.code;
        } else {
            console.error(error);
        }
        return ErrorShape.build({ code: code, error: error.message });
    }
}

export abstract class Handler<I extends IO, O extends IO> extends HandlerBase {
    //@
    definition!: HandlerInterface<I, O>;
}

export class Api {
    //@
    static base<I extends IO, O extends IO>(definition: HandlerInterface<I, O>) {
        //@
        return /* abstract */ class Augmented extends Handler<I, O> {
            //@
            constructor() {
                super();
                this.definition = definition;
            }

            async handle() {}

            // Used for discovery
            static __definition__ = definition;

            /*
             * This creates a new instance and runs..
             * TODO: Instead of this, we could create a "factory" instance inside
             *       static prop here to handle this stuff.
             */
            static async spwan(
                this: { new (): Augmented },
                req: RequestContext,
                input: I["data"]
            ): Promise<O["data"]> {
                //@
                const instance = new this();
                await instance.run(req);
                return instance.response;
            }
        };
        // return Augmented;
    }
}
