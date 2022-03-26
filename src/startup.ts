// require("@google-cloud/debug-agent").start({ serviceContext: { enableCanary: false } });
import express, { Express, Request, Response } from "express";
import { ApiDiscovery, IApiConfig } from "@lib/discovery";
import { UserContext } from "@lib/context";
import bodyParser from "body-parser";
import helmet from "helmet";
import dotenv from "dotenv";
import path from "path";

export function start(config: any): void {
    //@
    dotenv.config();

    const PORT = process.env.PORT || 5000;
    const app: Express = express();

    app.use(helmet());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    registerApiEndpoints(app);

    app.get("/apiv1/docs", docsHandler);

    app.listen(PORT, () => console.log(`Running on ${PORT} ⚡`));
}

function registerApiEndpoints(app: Express): void {
    //@
    const apis = new ApiDiscovery({ path: "" }).getAll();
    for (const api of apis) {
        const route = `/apiv1${api.meta.route}`;
        app.all(route, async (req: Request, res: Response) => {
            apiHandler(api, req, res);
        });
    }
}

async function apiHandler(api: IApiConfig, req: Request, res: Response) {
    try {
        const context = await UserContext.initialize(getAccessToken(req));
        const handler = new api.ctor();
        await handler.run({ context: context, payload: { ...req.body, ...req.query } });
        res.send(handler.response);
    } catch (error) {
        console.error(error);
        res.statusCode = 500;
        res.send({ error: 500 });
    }
}

async function docsHandler(req: Request, res: Response) {
    //@
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Content-Security-Policy", "script-src blob:");
    res.header("Content-Security-Policy", "worker-src blob:");
    res.sendFile(path.join(__dirname, "../../src/lib/docs/redoc.html"));
}

function getAccessToken(req: Request): string {
    let access_token = "";

    const payload = req.query as any;

    // const request = this.conf.request;

    // if (request.cookies[_AUTH_COOKIE_NAME]) {
    //     access_token = request.cookies[_AUTH_COOKIE_NAME];
    // }
    if (payload.access_token) {
        access_token = payload.access_token;
        // this.setCookie("_cosmos_auth", access_token, new Date());
    }

    return access_token;
}
