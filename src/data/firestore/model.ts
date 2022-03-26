// https://firebase.google.com/docs/firestore/manage-data/add-data
// https://googleapis.dev/nodejs/firestore/latest/

import { Timestamp } from "firebase-admin/firestore";
import { DataAccess } from "@lib/data/firestore/data";
import { ShapeBase } from "@lib/shape";
import { error } from "@lib/errors";
import { v4 as uuidv4 } from "uuid";

interface RepositoryConfig<T> {
    name: string;
    shape: ShapeBase<T>;
    useNamespace?: boolean;
}

interface FirestoreData {
    key?: string;
}

type Query = FirebaseFirestore.Query<FirebaseFirestore.DocumentData>;
type DocumentSnapshot = FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>;

/*
 * This repository acts as a remote service.. Query logic and any database vendor
 * specific logic should not be used outside of this class and derived classes
 */
export abstract class RepositoryBase<T extends FirestoreData> {
    //@
    abstract config: RepositoryConfig<T>;

    constructor(public da: DataAccess) {}

    build(data: T): T {
        return data;
    }

    /**
     * Creates a record
     */
    async create(data: T): Promise<T> {
        //@
        const ref = this.getCollection().doc(uuidv4());

        await ref.set({ ...data, namespace: this.da.namespace });

        return data;
    }

    /**
     * Updates a record
     */
    async update(data: Partial<T>): Promise<T> {
        //@
        if (!data.key) {
            throw new error.RecordNotFound();
        }

        const doc = await this.getDocument(data.key);

        await doc.ref.update(data);

        return this.get(data.key);
    }

    /**
     * Search for a single instance. Returns the first instance found, or null if none can be found.
     */
    async get(key: string): Promise<T> {
        //@
        const doc = await this.getDocument(key);

        return this.parseDocument(doc);
    }

    protected async getDocument(key: string) {
        //@
        const doc = await this.getCollection().doc(key).get();

        const data = doc.data();

        if (!data) {
            throw new error.RecordNotFound();
        }

        if (this.useNamespace && data.namespace !== this.da.namespace) {
            throw new error.RecordNotFound();
        }

        return doc;
    }

    protected getCollection() {
        //@
        return this.da.db.collection(this.config.name);
    }

    protected async queryDocument(s: (s: Query) => Query) {
        //@
        const collection = this.getCollection();

        let custom = s(collection);

        if (this.useNamespace) {
            custom = custom.where("namespace", "==", this.da.namespace);
        }

        const snapshot = await custom.get();

        return snapshot;
    }

    protected async query(s: (s: Query) => Query) {
        //@
        const snapshot = await this.queryDocument(s);

        return snapshot.docs.map((doc) => this.parseDocument(doc));
    }

    protected async queryOne(s: (s: Query) => Query) {
        //@
        const record = (await this.query(s)).pop();

        if (!record) {
            throw new error.RecordNotFound();
        }

        return record;
    }

    protected async deleteByQuery(s: (s: Query) => Query) {
        //@
        const snapshot = await this.queryDocument(s);

        for (const doc of snapshot.docs) {
            await doc.ref.delete();
        }
    }

    /**
     * Parse a Firestore document. This will return an object that represents
     * this repository shape.
     */
    protected parseDocument(doc: DocumentSnapshot): T {
        //@
        const data = this.convertData(doc.data());

        try {
            return this.config.shape.parse(data);
        } catch (ex: any) {
            throw new Error(
                `Error while parsing Firestore document as it does not match repository shape. ${ex.message}`
            );
        }
    }

    /**
     * Converts the data types represented in a Firestore document to its native counterpart.
     * i.e. Firestore uses a Timestamp object instead of the native Date object.
     */
    protected convertData(data: any) {
        //@
        for (const [key, value] of Object.entries(data)) {
            if (value instanceof Timestamp) {
                data[key] = value.toDate();
            } else if (value instanceof Object) {
                data[key] = this.convertData(value);
            }
        }
        return data;
    }

    protected get useNamespace(): boolean {
        //@
        return this.config.useNamespace && this.da.namespace ? true : false;
    }
}
