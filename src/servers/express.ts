// require("@google-cloud/debug-agent").start({ serviceContext: { enableCanary: false } });
import path from "path";
import helmet from "helmet";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { HostConfig } from "@lib/config";
import { UserContext } from "@lib/context";
import { RequestContext } from "@lib/request";
import { ApiDiscovery, IApiConfig } from "@lib/discovery";
import express, { Express, Request, Response } from "express";

const _AUTH_COOKIE_NAME = "_cosmos_auth";

export class ExpressRequest extends RequestContext {
    req: Request;
    res: Response;

    constructor(args: {
        ipAddress: string;
        hostName: string;
        payload: any;
        context: UserContext;
        req: Request;
        res: Response;
    }) {
        super(args);
        this.req = args.req;
        this.res = args.res;
    }

    status(code: number): void {
        this.res.status(code);
    }

    setCookie(name: string, value: string) {
        this.res.cookie(name, value);
    }
}

export class ExpressServer {
    //@
    app: Express;

    constructor(private config: HostConfig) {
        dotenv.config();

        this.app = express();
        // this.app.use(helmet());
        this.app.use(cookieParser());
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));

        this.app.get("/", (req, res) => {
            res.sendFile(path.join(__dirname, "../../src/base/pages/docs/redoc.html"));
        });

        this.app.get("/apiv1", (req, res) => {
            res.sendFile(path.join(__dirname, "../../src/base/pages/docs/redoc.html"));
        });

        this.app.get("/apiv1/term", (req, res) => {
            res.sendFile(path.join(__dirname, "../../src/base/pages/terminal/index.html"));
        });

        this.app.get("/apiv1/term/index.js", (req, res) => {
            res.sendFile(path.join(__dirname, "../../src/base/pages/terminal/index.js"));
        });
    }

    start(): Express {
        //@
        this.registerApiEndpoints();

        this.app.listen(this.config.port, () =>
            console.log(`Running on http://localhost:${this.config.port} ⚡`)
        );

        return this.app;
    }

    registerApiEndpoints() {
        //@
        const apis = new ApiDiscovery({ path: this.config.endpointPath }).getAll();
        for (const api of apis) {
            this.app.all(api.route, async (req: Request, res: Response) => {
                await this.handler(api, req, res);
            });
        }
    }

    async handler(api: IApiConfig, req: Request, res: Response) {
        try {
            const context = new UserContext({
                ipAddress: req.ip,
                accessToken: this.getAccessToken(req, res),
            });

            const requestContext = new ExpressRequest({
                req: req,
                res: res,
                context: context,
                ipAddress: req.ip,
                hostName: req.hostname,
                payload: { ...req.body, ...req.query },
            });

            const handler = new api.ctor();

            await handler.run(requestContext);

            res.send(handler.response);
        } catch (error) {
            console.error(error);
            res.statusCode = 500;
            res.send({ error: 500 });
        }
    }

    getAccessToken(req: Request, res: Response): string {
        let access_token = "";

        if (req.cookies[_AUTH_COOKIE_NAME]) {
            access_token = req.cookies[_AUTH_COOKIE_NAME];
        }
        if (req.query.access_token) {
            access_token = req.query.access_token as string;

            // res.cookie(_AUTH_COOKIE_NAME, access_token, { expires: new Date() });
        }

        return access_token;
    }
}
