# @newsteam/api-framework

## This is an api library designed for use in Newsteam microservices.

### Features

- Fully type safe
- Input and Output parsing and validation
- Services and middleware
- Proxy to remote api-framework implementation
- Api handler discovery (no manually hooking up handlers)
- OpenAPI v3 compatible
- Documentation interface
- Ability to document endpoints with markdown
- Extensive logging capabilities

### Examples

hello.ts
```
import { Api } from "@lib/request";
import { AnyShape } from "@lib/shape";

export default class extends Api.base({

    route: "/hello",
    permission: "public",
    description: "",
    input: AnyShape,
    output: AnyShape }) {

    async handle() {

        this.result = { hello: "world" };

    }
}
```

index.ts
```
import { start } from "@lib/startup";

start({
    port: 8080,
    endponts: "endpoints/**/*.ts"
});
```
