import { glob } from "glob";
import { Handler, HandlerInterface } from "@lib/request";

export interface IApiConfig {
    //@
    meta: HandlerInterface<any, any>;
    ctor: { new (): Handler<any, any> };
}

export let apiCache: IApiConfig[] = [];

export class ApiDiscovery {
    //@
    constructor(public opts: { path: string }) {}

    /**
     * Gets metadata for all endpoints including constructors
     */
    getAll(): IApiConfig[] {
        //@
        const paths = glob.sync("../endpoints/**/*.js", { cwd: __dirname }).sort();
        const endpoints: Record<string, IApiConfig> = {};
        for (const path of paths) {
            const api = require(path).default;
            if (api && api.__definition__) {
                const meta = api.__definition__ as HandlerInterface<any, any>;
                endpoints[meta.route] = { meta: meta, ctor: api };
            }
        }

        apiCache = Object.values(endpoints).map((x) => x);
        console.log(`[Found ${apiCache.length} APIs]`);
        return apiCache;
    }
}
