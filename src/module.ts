import { AnyShape } from "@lib/shape";
import { UserContext } from "@lib/context";
import { MySqlService } from "@lib/services/sql";
import { Service, Middleware } from "@lib/service";
import { HandlerInterface, IO, Api } from "@lib/request";

type Services = {
    [key: string]: Service;
};

export class ModuleBuilder<T extends Services> {
    //@
    services: Record<string, (services: T) => Service> = {};

    static create() {
        return new this();
    }

    addService<Name extends string, S extends Service>(key: Name, build: (services: T) => S) {
        //@
        this.services[key] = build;

        return this as unknown as ModuleBuilder<T & { [K in Name]: S }>;
    }

    addMiddleware<M extends Middleware>(key: string, build: (services: T) => M) {
        //@
        this.services[key] = build;

        return this;
    }

    initializeServices(): T {
        //@
        return Object.entries(this.services).reduce((obj, [key, build]) => {
            (obj as Services)[key] = build(obj);
            return obj;
        }, {} as T);
    }

    api<I extends IO, O extends IO>(definition: HandlerInterface<I, O>) {
        //@
        const host = this;

        return class extends Api.base(definition) {
            //@
            public services = host.initializeServices();

            override async onAuthentication(context: UserContext) {
                for (const x of Object.values(this.services)) {
                    if (x instanceof Middleware) {
                        await x.onAuthentication(context);
                    }
                }
            }

            override async onSuccess() {
                for (const x of Object.values(this.services)) {
                    await x.onSuccess();
                }
            }

            override async onException(error: any) {
                for (const x of Object.values(this.services)) {
                    await x.onException(error);
                }
            }
        };
    }
}

////////////////////////////////////////////////////////////

const host = ModuleBuilder.create().addService("sql", () => {
    return new MySqlService();
});

export default class extends host.api({
    //@
    route: "/basic",
    permission: "public",
    description: "",
    input: AnyShape,
    output: AnyShape,
}) {
    override async handle() {
        //@
        this.result = { hello: "world" };

        this.services.sql.dispose();
    }
}
