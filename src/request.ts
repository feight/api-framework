import { ShapeBase } from "@lib/shape";
import { ServiceBus } from "@lib/services";
import { UserContext } from "@lib/context";
import { AppException } from "@lib/exception";
// import ErrorShape from "shapes/endpoints/v1/error/error";

import { DatabaseError } from "sequelize";

type IO = ShapeBase<any>;

export interface RequestConfig {
    payload: any;
    context: UserContext;
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

const _AUTH_COOKIE_NAME = "_cosmos_auth";

abstract class HandlerBase {
    //@
    abstract definition: HandlerInterface<any, any>;

    response: any;
    context!: UserContext;
    config!: RequestConfig;
    services = new ServiceBus();
    args!: this["definition"]["input"]["data"];
    result!: this["definition"]["output"]["data"];

    abstract handle(): void;

    async dispose() {}

    async run(config: RequestConfig) {
        //@
        this.config = config;
        if (config.context) {
            this.context = config.context;
        }

        //
        try {
            // run
            this.args = this.definition.input.parse(config.payload);

            await this.handle();

            if (this.result) {
                //
                this.response = this.definition.output.parse(this.result);
            } else {
                this.response = this.success();
            }

            //
            await this.services.da.commit();
            //
        } catch (error: any) {
            await this.services.da.rollback();
            //
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

    setCookie(key: string, val: string, expires: Date) {
        // this.conf.response.cookie(key, val, { expires: expires, httpOnly: true });
    }

    async getErrorResponse(error: any) {
        let code = 0;
        ////////////////////////////
        if (error instanceof DatabaseError) {
            // 1146 - ER_NO_SUCH_TABLE
            if ((error.parent as any).errno === 1146) {
                await this.services.auth.syncTables();
                // return ErrorShape.build({
                //     code: 1146,
                //     message: "Some SQL tables do not exist, creating...",
                // });
            }
        }
        ////////////////////////////
        if (error instanceof AppException) {
            code = error.code;
        } else {
            console.error(error);
        }
        // return ErrorShape.build({ code: code, message: error.message });
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

            handle() {}

            // Used for discovery
            static __definition__ = definition;

            /*
             * This creates a new instance and runs..
             * TODO: Instead of this, we could create a "factory" instance inside
             *       static prop here to handle this stuff.
             */
            static async spwan(this: { new (): Augmented }, input: I["data"]): Promise<O["data"]> {
                //@
                const instance = new this();
                await instance.run({
                    payload: input,
                    context: new UserContext({ ipAddress: "poo" }),
                });
                return instance.response;
            }
        };
        // return Augmented;
    }
}
