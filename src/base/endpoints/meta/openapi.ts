import { Api } from "@lib/request";
import { AnyShape } from "@lib/shape";
import { apiCache } from "@lib/discovery";
import { settings } from "@lib/config";
import { ApiDocumentation } from "@lib/docs";
import { OpenApiBuilder } from "openapi3-ts";
import { generateSchema } from "@anatine/zod-openapi";
import ErrorShape from "@lib/base/shapes/error/error";

export default class extends Api.base({
    //@
    route: "/meta/openapi",
    permission: "public",
    description: "Gets OpenAPI schema",
    input: AnyShape,
    output: AnyShape,
}) {
    override async handle() {
        //@
        const docs = new ApiDocumentation();

        const builder = new OpenApiBuilder();

        builder
            .addInfo({
                version: "1.0",
                title: settings.name,
                description: docs.getOverview(),
            })
            .addServer({ url: "http://localhost:" + settings.port });

        this.appendSchema(builder, docs);

        this.result = builder.getSpec();
    }

    appendSchema(builder: OpenApiBuilder, docs: ApiDocumentation) {
        //@
        const errorSchema = generateSchema(ErrorShape.shape);

        for (const api of apiCache) {
            builder.addPath(api.route, {
                post: {
                    summary: api.meta.description,
                    tags: [this.getTag(api.meta.route)],
                    requestBody: {
                        description: docs.getEndpoint(api.meta.route),
                        content: {
                            "application/json": {
                                schema: generateSchema(api.meta.input.shape),
                            },
                        },
                    },
                    responses: {
                        200: {
                            content: {
                                "application/json": {
                                    schema: generateSchema(api.meta.output.shape),
                                },
                            },
                        },
                        500: {
                            content: {
                                "application/json": {
                                    schema: errorSchema,
                                },
                            },
                        },
                    },
                },
            });
        }
    }

    getTag(route: string): string {
        const s = route.split("/")[1] || "unknown";
        return s.charAt(0).toUpperCase() + s.slice(1);
    }
}
