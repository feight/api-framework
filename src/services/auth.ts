import { Middleware } from "@lib/service";
import { UserContext } from "@lib/context";
import { AppException } from "@lib/exception";
import { UserService } from "@lib/services/user";

/**
 * This service will perform user authentication on each request
 */
export class AuthenticationService extends Middleware {
    //@
    constructor(public userService: UserService) {
        super();
    }

    override async onAuthentication(context: UserContext) {
        await this.initialize(context);
    }

    override async initialize(context: UserContext, useCache = true) {
        //@
        // const context = new UserContext({ ipAddress: "" });
        if (!context) {
            context = new UserContext({ ipAddress: "" });
        }
        let accessToken = context.access_token;
        if (!accessToken) {
            accessToken = ""; //this.getAccessToken();
        }
        if (accessToken) {
            if (useCache) {
                var cached = undefined; // memcache.get(_AUTH_CACHE_KEY_PREFIX + access_token)
                if (cached) {
                    return new UserContext({ ipAddress: "" });
                }
            }
            try {
                await this.authenticate(context);
                // context.update_cache()
            } catch (ex) {
                if (ex instanceof AppException) {
                    if (ex.statusCode == 401) {
                        // webapp2.WSGIApplication.request.response.delete_cookie(_AUTH_COOKIE_NAME)
                        console.log("401: " + context.access_token);
                    } else {
                        throw ex;
                    }
                }
            }
        }

        return context;
    }

    async authenticate(context: UserContext) {
        //@
        //     response = self.call('user/me', access_token=access_token)

        const response = await this.userService.me(context.access_token!);

        context.is_guest = false;
        context.access_token = context.access_token;
        context.user = response;
        context.devices = undefined;
        context.enforce_device_limit = response.enforce_device_limit;
    }

    onAuthorization(action: string) {
        return true;
    }

    hasPermission(action: string) {
        return true;
    }

    getCurrentUser() {}

    login() {
        // create request token
        // create access token
    }

    logout() {}
}
