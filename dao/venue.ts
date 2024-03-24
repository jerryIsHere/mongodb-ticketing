import { ObjectId, WithId, Document } from "mongodb";
import { Database, RequestError } from "./database";
import { BaseDAO } from "./dao";

export class VenueDAO extends BaseDAO {
    public static readonly collection_name = "venues"
    private _venuename: string | undefined
    public get venuename() { return this._venuename }
    public set venuename(value: string | undefined) { this._venuename = value; BaseDAO.DirtyList.add(this); }

    constructor(params: { venuename?: string } & { doc?: WithId<Document> }) {
        super(params.doc && params.doc._id ? params.doc._id : undefined);
        if (params.doc && params.doc._id) {
            this._venuename = params.doc.venuename
        }
        if (params.venuename)
            this.venuename = params.venuename
    }
    static async listAll() {
        var cursor = Database.mongodb.collection(VenueDAO.collection_name).find()
        return cursor.toArray();
    }
    static async getById(id: string) {
        var doc = await Database.mongodb.collection(VenueDAO.collection_name).findOne({ _id: new ObjectId(id) })
        if (doc) {
            return new VenueDAO({ doc: doc })
        }
        throw new RequestError(`${this.name} has no instance with id ${id}.`)
    }
    async create(): Promise<VenueDAO> {
        var result = await Database.mongodb.collection(VenueDAO.collection_name).insertOne(this.Serialize(true))
        if (result.insertedId) {
            return this
        }
        else {
            throw new RequestError(`Creation of ${this.constructor.name} failed with unknown reason.`)
        }
    }

    async update(): Promise<VenueDAO> {
        if (this._id == undefined) throw new RequestError(`${this.constructor.name}'s DAO id is not initialized.`)
        var result = await Database.mongodb.collection(VenueDAO.collection_name).updateOne({ _id: new ObjectId(this._id) }, { $set: this.Serialize(true) })
        if (result.modifiedCount > 0) {
            return this
        }
        else {
            throw new RequestError(`Update of ${this.constructor.name} with id ${this._id} failed with unknown reason.`)
        }

    }

    async delete(): Promise<null> {
        if (this._id == undefined) throw new RequestError(`${this.constructor.name}'s DAO id is not initialized.`)
        var result = await Database.mongodb.collection(VenueDAO.collection_name).deleteOne({ _id: new ObjectId(this._id) })
        if (result.deletedCount > 0) {
            return null
        }
        else {
            throw new RequestError(`Deletation of ${this.constructor.name} with id ${this._id} failed with unknown reason.`)
        }
    }
}
