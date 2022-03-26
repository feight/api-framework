import { Sequelize, Transaction } from "sequelize";

const sequelize = new Sequelize("mysql://root:cosmos@mysql:3306/newsteam?charset=utf8mb4", {
    logging: false,
});

export class DataAccess {
    namespace?: string;
    connection: Sequelize;
    __transaction?: Transaction;

    constructor(namespace?: string) {
        this.namespace = namespace;
        this.connection = sequelize;
    }

    get transaction(): Promise<Transaction> {
        return (async () => {
            if (!this.__transaction) {
                this.__transaction = await this.connection.transaction();
            }
            return this.__transaction;
        })();
    }

    async commit() {
        await this.__transaction?.commit();
    }

    async rollback() {
        await this.__transaction?.rollback();
    }
}
