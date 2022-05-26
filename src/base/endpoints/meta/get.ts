import { Api } from "@lib/request";
import { AnyShape } from "@lib/shape";
import { apiCache } from "@lib/discovery";
import { generateSchema } from "@anatine/zod-openapi";

export default class extends Api.base({
    //@
    route: "/meta",
    permission: "public",
    description: "Gets NewsteamAPI metadata",
    input: AnyShape,
    output: AnyShape,
}) {
    override async handle() {
        //@
        this.result = {};

        for (const api of apiCache) {
            const args = <any>{};
            const route = api.meta.route.substring(1);
            const schema = generateSchema(api.meta.input.shape);

            if (schema.properties) {
                for (const [k, v] of Object.entries(schema.properties)) {
                    args[k] = {
                        type: (v as any).type,
                        format: (v as any).format,
                        default: (v as any).default,
                        required: schema.required?.includes(k) ? true : undefined,
                    };
                }
            }

            this.result[route] = {
                url: route,
                method: "GET",
                desc: api.meta.description,
                permission: api.meta.permission,
                args: args,
            };
        }
    }
}
