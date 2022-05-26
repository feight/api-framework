import { Sequelize, Transaction } from "sequelize";

let sequelize: Sequelize;

export class DataAccess {
    namespace?: string;
    connection: Sequelize;
    __transaction?: Transaction;
    connectionString: string;

    constructor(namespace?: string, connectionString?: string) {
        this.namespace = namespace;
        this.connectionString = connectionString ?? "";

        if (!sequelize) {
            sequelize = new Sequelize(this.connectionString, { logging: false });
        }

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
