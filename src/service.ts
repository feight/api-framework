import { UserContext } from "@lib/context";

export abstract class Service {
    context!: UserContext;

    async dispose() {}
    async onSuccess() {}
    async onException(error: any) {}
}

export abstract class Middleware extends Service {
    async onAuthentication(context: UserContext) {}
}
