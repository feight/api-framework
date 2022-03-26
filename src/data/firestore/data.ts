import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

initializeApp({
    credential: applicationDefault(),
    projectId: "newsteam-stage",
});

const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

export class DataAccess {
    db: Firestore;
    namespace?: string;

    constructor(namespace?: string) {
        this.namespace = namespace;
        this.db = db;
    }
}
