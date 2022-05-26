import { Shape, z } from "@lib/shape";

const shape = new Shape(
    z.object({
        name: z.string(),
        port: z.number(),
        endpointPath: z.string(),
    })
);

export type SettableHostConfig = typeof shape.data;

export class HostConfig implements SettableHostConfig {
    /**
     * Name of the API
     */
    name: string;
    /**
     * Port on which to listen for incoming requests
     */
    port: number;
    /**
     * Path to endpoints classes i.e /endpoints/**/ /*.ts
     */
    endpointPath: string;
    /**
     * Checks whether this is a local or production server
     */
    local: boolean;

    constructor(conf: SettableHostConfig) {
        //@
        shape.parse(conf);

        this.name = conf.name;
        this.port = conf.port;
        this.endpointPath = conf.endpointPath;
        this.local = this.isLocal();

        settings = this;
    }

    private isLocal() {
        return process.env.NODE_ENV !== "production";
    }
}

export let settings: HostConfig;
