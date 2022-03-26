import { DataAccess as FirestoreData } from "@lib/data/firestore/data";
import { DataAccess as SqlData } from "@lib/data/sql/data";
// import { RequestTokenRepository } from "data/auth/request-token";
// import { OrganizationRepository } from "data/auth/organization";
// import { AccessTokenRepository } from "data/auth/access-token";
// import { NamespaceRepository } from "data/auth/namespace";
// import { ConsumerRepository } from "data/auth/consumer";
// import { UserRepository } from "data/auth/user";

export class AuthServiceBus {
    //@
    // organization = new OrganizationRepository(this.da).initialize();
    // namespace = new NamespaceRepository(this.da).initialize();
    // consumer = new ConsumerRepository(this.da).initialize();
    // user = new UserRepository(this.da).initialize();

    // tokens = {
    //     request: new RequestTokenRepository(this.fs),
    //     access: new AccessTokenRepository(this.fs),
    // };

    constructor(protected da: SqlData, protected fs: FirestoreData) {
        this.configureAssociations();
    }

    protected configureAssociations() {
        // this.namespace.repo.belongsTo(this.organization.repo);
        // this.consumer.repo.belongsTo(this.namespace.repo);
        // this.user.repo.belongsTo(this.namespace.repo);
    }

    async syncTables() {
        await this.da.connection.sync();
    }
}
