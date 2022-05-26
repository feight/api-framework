import { Service } from "@lib/service";

export abstract class UserService extends Service {
    //@
    abstract me(accessToken: string): any;
}
