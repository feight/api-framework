import { Shape, z } from "@lib/shape";

export default new Shape(
    z.strictObject({
        code: z.number(),
        error: z.string(),
    })
);
