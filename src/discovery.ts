import { glob } from "glob";
import { Handler, HandlerInterface } from "@lib/request";

export interface IApiConfig {
    //@
    route: string;
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
        const libPaths = glob.sync(__dirname + "/base/endpoints/**/*.js", { cwd: __dirname });
        const paths = glob.sync(this.opts.path, { cwd: __dirname }).concat(libPaths).sort();
        const endpoints: Record<string, IApiConfig> = {};
        for (const path of paths) {
            const api = require(path).default;
            if (api && api.__definition__) {
                const meta = api.__definition__ as HandlerInterface<any, any>;
                endpoints[meta.route] = { meta: meta, route: `/apiv1${meta.route}`, ctor: api };
            }
        }

        apiCache = Object.values(endpoints).map((x) => x);
        console.log(`[Found ${apiCache.length} APIs]`);
        return apiCache;
    }
}
