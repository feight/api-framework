import { Service } from "@lib/service";
import { DataAccess } from "@lib/data/sql/data";
import { DatabaseError } from "sequelize";

export class MySqlService extends Service {
    da: DataAccess;

    constructor(connectionString?: string) {
        super();
        this.da = new DataAccess("newsteam", connectionString);
    }

    override async dispose() {
        console.log("Closing sql connection...");
    }

    override async onSuccess() {
        await this.da.commit();
    }

    override async onException(error: any) {
        //@
        await this.da.rollback();

        if (error instanceof DatabaseError) {
            await this.da.connection.sync();
        }

        ////////////////////////////
        // if (error instanceof DatabaseError) {
        //     // 1146 - ER_NO_SUCH_TABLE
        //     if ((error.parent as any).errno === 1146) {
        //         await this.da.connection.sync();
        //         // return ErrorShape.build({
        //         //     code: 1146,
        //         //     message: "Some SQL tables do not exist, creating...",
        //         // });
        //     }
        // }
        ////////////////////////////
    }
}
