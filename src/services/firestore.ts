import { Service } from "@lib/service";
import { DataAccess } from "@lib/data/firestore/data";

export class FirestoreService extends Service {
    da: DataAccess;

    constructor() {
        super();
        this.da = new DataAccess();
    }
}
