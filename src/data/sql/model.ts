// https://sequelize.org/v7/manual/model-instances.html

import { DataTypes, ModelAttributes, FindOptions, Model } from "sequelize";
import { DataAccess } from "@lib/data/sql/data";
import { ShapeBase } from "@lib/shape";

interface RepositoryConfig<T> {
    name: string;
    shape: ShapeBase<T>;
    useNamespace?: boolean;
    schema: ModelAttributes<Model<T>>;
}

interface SqlInterface {
    key?: string;
}

/*
 * This repository acts as a remote service.. Query logic and any database vendor
 * specific logic should not be used outside of this class and derived classes
 */
export abstract class RepositoryBase<T extends SqlInterface> {
    //@
    constructor(public da: DataAccess) {}

    abstract config: RepositoryConfig<T>;

    private repo = class extends Model<T> {};

    build(data: T): T {
        return data;
    }

    async create(data: Partial<T>): Promise<T> {
        //@
        const model = this.validate(data);

        const instance = this.repo.build({ ...model, namespaceId: this.da.namespace });

        await instance.save({ transaction: await this.da.transaction });

        return this.parseData(instance.toJSON());
    }

    async update(data: Partial<T>) {
        //@
        await this.repo.update(
            { ...data, namespaceId: this.da.namespace },
            { where: { key: data.key }, transaction: await this.da.transaction }
        );
    }

    /**
     * Get single instance by key (uuid).
     */
    async get(key: string): Promise<T | null> {
        //@
        return this.findOne({ where: { key: key } });
    }

    /**
     * Search for a single instance. Returns the first instance found, or null if none can be found.
     */
    protected async findOne(options: FindOptions<T>): Promise<T | null> {
        //@
        const instance = await this.repo.findOne({
            ...options,
            transaction: await this.da.transaction,
        });

        return instance ? this.parseData(instance.toJSON()) : null;
    }

    protected async findAll(options: FindOptions<T>): Promise<T[]> {
        //@
        const instances = await this.repo.findAll({
            ...options,
            transaction: await this.da.transaction,
        });

        return instances.map((instance) => this.parseData(instance.toJSON()));
    }

    /**
     * Initializes a Sequelize model.
     */
    public initialize(): this {
        //@
        const model = this.da.connection.models[this.config.name];
        if (model) {
            this.repo = model;
            return this;
        }

        const schema = this.config.schema;

        schema.key = { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false };

        this.repo.init(schema, {
            sequelize: this.da.connection,
            tableName: this.config.name,
            modelName: this.config.name,
            underscored: true,
            paranoid: true,
        });

        return this;
    }

    protected validate(data: any) {
        return this.config.shape.parse(data);
    }

    /**
     * Parse MySql data. This will return an object that represents this repository shape.
     */
    protected parseData(data: T): T {
        //@
        try {
            return this.config.shape.parse(data);
        } catch (ex: any) {
            throw new Error(
                `Error while parsing MySql data as it does not match repository shape. ${ex.message}`
            );
        }
    }
}
