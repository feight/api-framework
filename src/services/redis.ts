import { Service } from "@lib/service";

export class RedisService extends Service {
    connect() {
        console.log("connecting to redis>>>...");
    }
}
