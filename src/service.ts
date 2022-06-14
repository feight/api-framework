import { UserContext } from "@lib/context";

export abstract class Service {
    context!: UserContext;

    async dispose() {}
    async onSuccess() {}
    async onException(error: any) {}

    initialize(context: UserContext) {
        this.context = context;
    }
}

export abstract class Middleware extends Service {
    async onAuthentication(context: UserContext) {}
}
