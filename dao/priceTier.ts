import { WithId, Document, ObjectId } from "mongodb";
import { Database, RequestError } from "./database";
import { BaseDAO } from "./dao";


export class PriceTierDAO extends BaseDAO {
    public static readonly collection_name = "priceTiers"
    private _tierName: string | undefined
    public get tierName() { return this._tierName }
    public set tierName(value: string | undefined) { this._tierName = value;  }


    private _price: number | undefined
    public get price() { return this._price }
    public set price(value: number | undefined) {
        if (value && value < 0) {
            throw new RequestError('Price must be greater then 0.')
        }
        else {
            this._price = value; 
        }
    }

    constructor(params: { tierName?: string, price?: number } & { doc?: WithId<Document> }) {
        super(params.doc && params.doc._id ? params.doc._id : undefined);
        if (params.doc && params.doc._id) {
            this._tierName = params.doc.tierName
            this._price = params.doc.price
        }
        if (params.tierName) this.tierName = params.tierName
        if (params.price) this.price = params.price
    }
    static async listAll() {
        var cursor = Database.mongodb.collection(PriceTierDAO.collection_name).find()
        return cursor.toArray();
    }
    static async getById(id: string) {
        var doc = await Database.mongodb.collection(PriceTierDAO.collection_name).findOne({ _id: new ObjectId(id) })
        if (doc) {
            return new PriceTierDAO({ doc: doc })
        }
        throw new RequestError(`${this.name} has no instance with id ${id}.`)
    }

    async create(): Promise<PriceTierDAO> {
        var result = await Database.mongodb.collection(PriceTierDAO.collection_name).insertOne(this.Serialize(true))
        if (result.insertedId) {
            return this
        }
        else {
            throw new RequestError(`Creation of ${this.constructor.name} failed with unknown reason.`)
        }
    }

    async update(): Promise<PriceTierDAO> {
        if (this._id == undefined) throw new RequestError(`${this.constructor.name}'s DAO id is not initialized.`)
        var result = await Database.mongodb.collection(PriceTierDAO.collection_name).updateOne({ _id: new ObjectId(this._id) }, { $set: this.Serialize(true) })
        if (result.modifiedCount > 0) {
            return this
        }
        else {
            throw new RequestError(`Update of ${this.constructor.name} with id ${this._id} failed with unknown reason.`)
        }

    }

    async delete(): Promise<null> {
        if (this._id == undefined) throw new RequestError(`${this.constructor.name}'s DAO id is not initialized.`)
        var result = await Database.mongodb.collection(PriceTierDAO.collection_name).deleteOne({ _id: new ObjectId(this._id) })
        if (result.deletedCount > 0) {
            return null
        }
        else {
            throw new RequestError(`Deletation of ${this.constructor.name} with id ${this._id} failed with unknown reason.`)
        }
    }
}
