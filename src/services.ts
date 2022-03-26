import { DataAccess as SqlDataAccess } from "@lib/data/sql/data";
import { DataAccess as FbDataAccess } from "@lib/data/firestore/data";

// import { ArticleRepository } from "data/article";
import { AuthServiceBus } from "@lib/services/auth";

export class ServiceBus {
    //@
    // TODO: use getters on services as to initialize
    //       only on property access.
    //
    // Investigate dependency injection.

    fs = new FbDataAccess("newsteam");
    da = new SqlDataAccess("newsteam");

    auth = new AuthServiceBus(this.da, this.fs);

    // content = {
    //     article: new ArticleRepository(this.fs),
    // };
}
