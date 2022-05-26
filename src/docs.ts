import fs from "fs";
import path from "path";
import { glob } from "glob";
import { cache } from "@lib/data/cache/local";

export class ApiDocumentation {
    paths: Array<string>;

    constructor() {
        this.paths = glob.sync("src/docs/**/*.md", { cwd: process.cwd() });
    }

    getOverview() {
        return this.get("src/docs/overview.md");
    }

    getEndpoint(apiPath: string) {
        return this.get(path.join("src/docs/endpoints", apiPath + ".md"));
    }

    get(docPath: string) {
        if (this.paths.includes(docPath)) {
            return cache.getCache(docPath, () => {
                return fs.readFileSync(docPath, "utf-8").trim();
            });
        }

        return "";
    }
}
