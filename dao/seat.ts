import { MongoClient, ObjectId, WithId, Document, InsertOneResult } from "mongodb";
import { Database, RequestError } from "./database";
import { BaseDAO } from "./dao";
import { VenueDAO } from "./venue";
import { TicketDAO } from "./ticket";



export class SeatDAO extends BaseDAO {
    public static readonly collection_name = "seats"
    private _row: string | undefined
    public get row() { return this._row }
    public set row(value: string | undefined) { this._row = value; }

    private _no: number | undefined
    public get no() { return this._no }
    public set no(value: number | undefined) { this._no = value; }

    private _venueId: ObjectId | undefined
    public get venueId() { return this._venueId }
    public set venueId(value: ObjectId | string | undefined) {
        // return Database.mongodb.collection(VenueDAO.collection_name).findOne({ _id: new ObjectId(value) }).then(instance => {
        //     if (instance == null) {
        //         throw new RequestError(`Venue with id ${value} doesn't exists.`)
        //     }
        //     else {
        this._venueId = new ObjectId(value);
        //     }
        // })
    }
    constructor(params: {
        row?: string,
        no?: number,
    } & { doc?: WithId<Document> }
    ) {
        super(params.doc && params.doc._id ? params.doc._id : undefined);
        if (params.doc && params.doc._id) {
            this._row = params.doc.row
            this._no = params.doc.no
            this._venueId = params.doc.venueId
        }
        if (params.row)
            this.row = params.row

        if (params.no)
            this.no = params.no
    }
    static async listByVenueId(venueId: string) {
        return new Promise<SeatDAO[]>(async (resolve, reject) => {
            var cursor = Database.mongodb.collection(SeatDAO.collection_name).find({ venueId: new ObjectId(venueId) })
            resolve((await cursor.toArray()).map(doc => new SeatDAO({ doc: doc })));
        })
    }
    static async getById(id: string) {

        return new Promise<SeatDAO>(async (resolve, reject) => {

            var doc = await Database.mongodb.collection(SeatDAO.collection_name).findOne({ _id: new ObjectId(id) })
            if (doc) {
                resolve(new SeatDAO({ doc: doc }))
            }
            reject(new RequestError(`${this.name} has no instance with id ${id}.`))
        })
    }
    async checkReference() {
        await Database.mongodb.collection(VenueDAO.collection_name).findOne({ _id: this._venueId }).then(instance => {
            if (instance == null) {
                throw new RequestError(`Venue with id ${this._venueId} doesn't exists.`)
            }
        })
    }
    async create(): Promise<SeatDAO> {
        return new Promise<SeatDAO>((resolve, reject) => {
            Database.session.withTransaction(async () => {
                try {
                    await this.checkReference()
                }
                catch (error) {
                    reject(error)
                    return
                }
                var result = await Database.mongodb.collection(SeatDAO.collection_name).insertOne(this.Serialize(true))
                if (result.insertedId) {
                    Database.session.commitTransaction();
                    resolve(this)
                }
                else {
                    reject(new RequestError(`Creation of ${this.constructor.name} failed with unknown reason.`))
                    return
                }
            })
        }).finally(() => {
            Database.session.endSession();
        })
    }

    static async batchCreate(daos: SeatDAO[]): Promise<SeatDAO[]> {
        return new Promise<SeatDAO[]>((resolve, reject) => {
            Database.session.withTransaction(async () => {
                Promise.all(daos.map(dao =>
                    new Promise<SeatDAO>(async (daoresolve, daoreject) => {
                        try {
                            await dao.checkReference()
                        }
                        catch (err) {
                            daoreject(err)
                            return
                        }
                        var result = await Database.mongodb.collection(SeatDAO.collection_name).insertOne(dao.Serialize(true))
                        if (result.insertedId) {
                            daoresolve(dao)
                        }
                        else {
                            daoreject(new RequestError(`Creation of ${dao.constructor.name} failed with unknown reason.`))
                            return
                        }
                    })
                )).then(daos => {
                    resolve(daos)
                    Database.session.commitTransaction();
                })
            })
        }).finally(() => {
            Database.session.endSession();
        })
    }
    async update(): Promise<SeatDAO> {
        return new Promise<SeatDAO>(async (resolve, reject) => {
            if (this._id == undefined) { reject(new RequestError(`${this.constructor.name}'s id is not initialized.`)); return }
            var result = await Database.mongodb.collection(SeatDAO.collection_name).updateOne({ _id: new ObjectId(this._id) }, { $set: this.Serialize(true) })
            if (result.modifiedCount > 0) {
                return this
            }
            else {
                throw new RequestError(`Update of ${this.constructor.name} with id ${this._id} failed with unknown reason.`)
            }

        })

    }
    async checkTicketDependency() {
        var ticket = await Database.mongodb.collection(TicketDAO.collection_name).findOne({ priceTier_id: this._id })
        return ticket
    }
    async delete(): Promise<SeatDAO> {
        return new Promise<SeatDAO>((resolve, reject) => {
            Database.session.withTransaction(async () => {
                var dependency = await this.checkTicketDependency()
                if (dependency != null) {
                    return reject(new RequestError(`Deletation of ${this.constructor.name} with id ${this._id} failed` +
                        `as ticket with id ${dependency._id} depends on it.`))
                }
                if (this._id) {
                    var result = await Database.mongodb.collection(SeatDAO.collection_name).deleteOne({ _id: new ObjectId(this._id) })
                    if (result.deletedCount > 0) {
                        Database.session.commitTransaction();
                        resolve(this)
                    }
                }
                else { return reject(new RequestError(`${this.constructor.name}'s id is not initialized.`)) }
            })
        }).finally(() => {
            Database.session.endSession();
        })
    }
}
