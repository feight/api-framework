// import UserMe from "endpoints/auth/user/me";
import { AppException } from "@lib/exception";

export class UserContext {
    //@
    ipAddress: string;
    enforce_device_limit: boolean = false;
    access_token?: string;
    is_guest: boolean = true;
    devices: any;
    user?: any; //typeof UserMe.__definition__.output.data
    origin: any;

    constructor(data: { ipAddress: string }) {
        this.ipAddress = data.ipAddress;
    }

    get id(): string {
        if (this.user) {
            return this.user.email;
        }
        return "guest";
    }

    /*
     * Return an instance of UserContext.
     * If an access_token was supplied or found in the auth cookie
     * or HTTP GET, the context will try to be authenticated.
     */
    static async initialize(accessToken?: string, useCache = true): Promise<UserContext> {
        //@
        const context = new UserContext({ ipAddress: "" });

        if (!accessToken) {
            accessToken = this.getAccessToken();
        }

        if (accessToken) {
            if (useCache) {
                var cached = ""; // memcache.get(_AUTH_CACHE_KEY_PREFIX + access_token)
                if (cached) {
                    return new UserContext({ ipAddress: "" });
                }
            }
            try {
                await context.authenticate(accessToken);
                // context.update_cache()
            } catch (ex) {
                if (ex instanceof AppException) {
                    if (ex.statusCode == 401) {
                        // webapp2.WSGIApplication.request.response.delete_cookie(_AUTH_COOKIE_NAME)
                    } else {
                        throw ex;
                    }
                }
            }
        }

        return context;
    }

    static getAccessToken(): string {
        return "<<testing>>";
    }

    async authenticate(accessToken: string) {
        //@
        //     response = self.call('user/me', access_token=access_token)

        // const response = await UserMe.spwan({ access_token: accessToken });

        // this.is_guest = false;
        // this.access_token = accessToken;
        // this.user = response;
        // this.devices = undefined;
        // this.enforce_device_limit = response.enforce_device_limit;
    }
}
