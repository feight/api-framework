import { settings } from "@lib/config";

export class Logger {
    _log(level: string, args: string[]) {
        console.log(`[${Date.now()}] ${level.toUpperCase()}:`, args);
    }

    debug(...args: string[]) {
        if (settings.local) {
            this._log("debug", args);
        }
    }

    info(...args: string[]) {
        this._log("info", args);
    }

    error(...args: string[]) {
        this._log("error", args);
    }
}

export const logger = new Logger();
