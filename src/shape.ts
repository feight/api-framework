export { z } from "zod";
import { z, ZodTypeAny, ZodError } from "zod";
import { generateMock } from "@anatine/zod-mock";
import { AppException } from "@lib/exception";

export abstract class ShapeBase<T> {
    //@
    data!: T;
    abstract parse(input: any): T;
}

export class Shape<T extends ZodTypeAny> extends ShapeBase<T["_output"]> {
    //@
    shape: T;

    constructor(shape: T) {
        super();
        this.shape = shape;
    }

    build(args?: T["_output"]): T["_output"] {
        return args;
    }

    parse(input: any): T["_output"] {
        if (input && input.generate_data === "1") return this.generateFakeData();

        try {
            return this.shape.parse(input);
        } catch (ex) {
            if (ex instanceof ZodError) {
                const errors = [];
                for (const err of ex.issues) {
                    errors.push(`argument for "${err.path}" is ${err.message}`.toLowerCase());
                    console.error([errors[0], input]);
                    break;
                }
                throw new AppException(errors.join("; "));
            }
            throw ex;
        }
    }

    generateFakeData() {
        return generateMock(this.shape);
    }
}

export const AnyShape = new Shape(z.any());

export const io = {
    //@
    date: () =>
        z
            .number()
            .transform((s) => new Date(s))
            .refine((s) => s.getFullYear() > 1990, {
                message: "expected unix timestamp in milliseconds",
            }),

    number: () =>
        z
            .union([z.string(), z.number()])
            .transform((s) => Number(s))
            .refine((val) => !isNaN(val), { message: "expected number" }),
};
