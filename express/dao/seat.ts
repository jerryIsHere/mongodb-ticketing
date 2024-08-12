import { MongoClient, ObjectId, WithId, Document, InsertOneResult } from "mongodb";
import { Database, RequestError } from "../database";
import { BaseDAO } from "./dao";
import { VenueDAO } from "./venue";
import { TicketDAO } from "./ticket";
import { Response } from "express";

export type coordType = { orderInRow: number, sectX: number, sectY: number }
export function coordTypeCheck(c: coordType): c is coordType {
    return c && typeof c.orderInRow == "number" &&
        typeof c.sectX == "number" &&
        typeof c.sectY == "number"
}

export class SeatDAO extends BaseDAO {
    public static readonly collection_name = "seats"
    private _row: string | undefined
    public get row() { return this._row }
    public set row(value: string | undefined) { this._row = value ? value.toUpperCase() : undefined; }

    private _no: number | undefined
    public get no() { return this._no }
    public set no(value: number | undefined) { this._no = value; }
    private _coord: coordType | undefined
    public get coord() { return this._coord }
    public set coord(value: coordType | undefined) {
        if (value && coordTypeCheck(value)) {
            this._coord = value
        }
    }

    private _venueId: ObjectId | undefined
    public get venueId() { return this._venueId }
    public set venueId(value: ObjectId | string | undefined) {
        this._venueId = new ObjectId(value);
    }
    constructor(
        res: Response, params: {
            row?: string,
            no?: number,
            coord?: coordType
        } & { doc?: WithId<Document> }
    ) {
        super(res, params.doc && params.doc._id ? params.doc._id : undefined);
        if (params.doc && params.doc._id) {
            this._row = params.doc.row
            this._no = params.doc.no
            this._venueId = params.doc.venueId
            this._coord = params.doc.coord
        }
        if (params.row)
            this.row = params.row

        if (params.no)
            this.no = params.no
        if (params.coord)
            this.coord = params.coord
    }
    static async listByVenueId(
        res: Response, venueId: string) {
        return new Promise<SeatDAO[]>(async (resolve, reject) => {
            var cursor = Database.mongodb.collection(SeatDAO.collection_name).find({ venueId: new ObjectId(venueId) })
            resolve((await cursor.toArray()).map(doc => new SeatDAO(res, { doc: doc })));
        })
    }
    static async getById(
        res: Response, id: string) {

        return new Promise<SeatDAO>(async (resolve, reject) => {

            var doc = await Database.mongodb.collection(SeatDAO.collection_name).findOne({ _id: new ObjectId(id) })
            if (doc) {
                resolve(new SeatDAO(res, { doc: doc }))
            }
            reject(new RequestError(`${this.name} has no instance with id ${id}.`))
        })
    }


    static async getByIds(
        res: Response, ids: string[]): Promise<SeatDAO[]> {
        return new Promise<SeatDAO[]>(async (resolve, reject) => {
            Promise.all(
                ids.map(async id =>
                    new Promise<SeatDAO>(async (daoresolve, daoreject) => {
                        var doc = await Database.mongodb.collection(SeatDAO.collection_name).findOne({ _id: new ObjectId(id) })
                        if (doc) {
                            daoresolve(new SeatDAO(res, { doc: doc }))
                        }
                        daoreject(new RequestError(`${this.name} has no instance with id ${id}.`))
                    }))
            ).then(daos => {
                resolve(daos)
            })
        })
    }
    async checkReference() {
        await Database.mongodb.collection(VenueDAO.collection_name).findOne({ _id: this._venueId }).then(instance => {
            if (instance == null) {
                this.res.locals.RequestErrorList.push(new RequestError(`Venue with id ${this._venueId} doesn't exists.`))
            } else if (instance.sections.filter((s: any) => s.x == this.coord?.sectX && s.y == this.coord?.sectY).length == 0) {
                this.res.locals.RequestErrorList.push(new RequestError(`Venue with id ${this._venueId} doesn't contain section ${this.coord?.sectX}-${this.coord?.sectY}.`))
            }
        })
    }
    async duplicationChecking() {
        await Database.mongodb.collection(SeatDAO.collection_name).findOne({ venueId: this.venueId, no: this.no, row: this.row }).then(instance => {
            if (instance) {
                this.res.locals.RequestErrorList.push(new RequestError(`Seat in the same venue with id ${this.venueId} at row ${this.row} with no ${this.no} already exists.`))
            }
        })
    }
    async create(): Promise<SeatDAO> {
        return new Promise<SeatDAO>(async (resolve, reject) => {
            this.res.locals.session.startTransaction()
            try {
                await this.checkReference()
                await this.duplicationChecking()
            }
            catch (error) {
                reject(error)
                return
            }
            var result = await Database.mongodb.collection(SeatDAO.collection_name).insertOne(this.Serialize(true), { session: this.res.locals.session })
            if (result.insertedId) {
                resolve(this)
            }
            else {
                reject(new RequestError(`Creation of ${this.constructor.name} failed with unknown reason.`))
                return
            }
        })
    }

    static async batchCreate(res: Response, daos: SeatDAO[]): Promise<SeatDAO[]> {
        return new Promise<SeatDAO[]>((resolve, reject) => {
            res.locals.session.startTransaction()
            Promise.all(daos.map(dao =>
                new Promise<SeatDAO>(async (daoresolve, daoreject) => {
                    try {
                        await dao.checkReference()
                        await dao.duplicationChecking()
                    }
                    catch (err) {
                        daoreject(err)
                        return
                    }
                    try {
                        var result = await Database.mongodb.collection(SeatDAO.collection_name).insertOne(dao.Serialize(true), { session: res.locals.session })

                        if (result && result.insertedId) {
                            daoresolve(dao)
                        }
                        else {
                            daoreject(new RequestError(`Creation of ${dao.constructor.name} failed with unknown reason.`))
                            return
                        }
                    } catch (err) { console.log(err); reject(new RequestError(`Server is busy. Please retry later and perhaps reduce the size of your request..`)) }
                })
            )).then(daos => {
                resolve(daos)
            })
        })
    }
    async update(): Promise<SeatDAO> {
        return new Promise<SeatDAO>(async (resolve, reject) => {
            if (this._id == undefined) { reject(new RequestError(`${this.constructor.name}'s id is not initialized.`)); return }
            try {
                await this.checkReference()
                await this.duplicationChecking()
            }
            catch (err) {
                reject(err)
                return
            }
            var result = await Database.mongodb.collection(SeatDAO.collection_name).updateOne({ _id: new ObjectId(this._id) }, { $set: this.Serialize(true) }, { session: this.res.locals.session })
            if (result.modifiedCount > 0) {
                resolve(this)
            }
            else {
                reject(new RequestError(`Update of ${this.constructor.name} with id ${this._id} failed with unknown reason.`))
            }

        })

    }
    async checkTicketDependency() {
        var ticket = await Database.mongodb.collection(TicketDAO.collection_name).findOne({ priceTier_id: this._id })
        return ticket
    }
    async delete(): Promise<SeatDAO> {
        return new Promise<SeatDAO>(async (resolve, reject) => {
            this.res.locals.session.startTransaction()
            var dependency = await this.checkTicketDependency()
            if (dependency != null) {
                reject(new RequestError(`Deletation of ${this.constructor.name} with id ${this._id} failed ` +
                    `as ticket with id ${dependency._id} depends on it.`)); return
            }
            if (this._id) {
                var result = await Database.mongodb.collection(SeatDAO.collection_name).deleteOne({ _id: new ObjectId(this._id) }, { session: this.res.locals.session })
                if (result.deletedCount > 0) {

                    resolve(this)
                }
            }
            else { reject(new RequestError(`${this.constructor.name}'s id is not initialized.`)); return }
        })
    }
    static async batchDelete(res: Response, daos: SeatDAO[]): Promise<SeatDAO[]> {
        return new Promise<SeatDAO[]>((resolve, reject) => {
            res.locals.session.startTransaction()
            Promise.all(daos.filter(dao => dao.id != undefined).map(dao =>
                new Promise<SeatDAO>(async (daoresolve, daoreject) => {
                    var dependency = await dao.checkTicketDependency()
                    if (dependency != null) {
                        reject(new RequestError(`Deletation of ${this.constructor.name} with id ${dao._id} failed ` +
                            `as ticket with id ${dependency._id} depends on it.`)); return
                    }
                    try {
                        var result = await Database.mongodb.collection(SeatDAO.collection_name).deleteOne(dao.Serialize(true), { session: res.locals.session })
                        if (result && result.deletedCount > 0) {
                            daoresolve(dao)
                        }
                        else {
                            daoreject(new RequestError(`Deletation of ${dao.constructor.name} with id ${dao.id} failed with unknown reason.`))
                        }
                    } catch (err) { console.log(err); reject(new RequestError(`Server is busy. Please retry later and perhaps reduce the size of your request..`)) }
                })
            )).then(daos => {
                resolve(daos)
            })
        })
    }
}
