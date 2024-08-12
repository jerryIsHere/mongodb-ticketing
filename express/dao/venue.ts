import { ObjectId, WithId, Document } from "mongodb";
import { Database, RequestError } from "../database";
import { BaseDAO } from "./dao";
import { SeatDAO } from "./seat";
import { EventDAO } from "./event";
import { Response } from "express";

export type sectionType = { x: number, y: number, options: any }
export function sectionTypeCheck(s: sectionType): s is sectionType {
    return typeof s.x == "number" &&
        typeof s.y == "number"
}

export class VenueDAO extends BaseDAO {
    public static readonly collection_name = "venues"
    private _sections: sectionType[] | undefined
    public get sections() { return this._sections }
    public set sections(value: sectionType[] | undefined) { this._sections = value; }

    private _venuename: string | undefined
    public get venuename() { return this._venuename }
    public set venuename(value: string | undefined) { this._venuename = value; }

    constructor(
        res: Response, params: { venuename?: string, sections?: sectionType[] } & { doc?: WithId<Document> }) {
        super(res, params.doc && params.doc._id ? params.doc._id : undefined);
        if (params.doc && params.doc._id) {
            this._venuename = params.doc.venuename
            this._sections = params.doc.sections
        }
        if (params.venuename)
            this.venuename = params.venuename
        if (params.sections)
            this.sections = params.sections
    }
    static async listAll(res: Response,) {
        return new Promise<VenueDAO[]>(async (resolve, reject) => {
            var cursor = Database.mongodb.collection(VenueDAO.collection_name).find()
            resolve((await cursor.toArray()).map(doc => new VenueDAO(res, { doc: doc })));
        })
    }
    static async getById(
        res: Response, id: string) {

        return new Promise<VenueDAO>(async (resolve, reject) => {
            var doc = await Database.mongodb.collection(VenueDAO.collection_name).findOne({ _id: new ObjectId(id) })
            if (doc) {
                resolve(new VenueDAO(res, { doc: doc }))
            }
            reject(new RequestError(`${this.name} has no instance with id ${id}.`))
        })
    }
    async create(): Promise<VenueDAO> {

        return new Promise<VenueDAO>(async (resolve, reject) => {
            var result = await Database.mongodb.collection(VenueDAO.collection_name).insertOne(this.Serialize(true), { session: this.res.locals.session })
            if (result.insertedId) {
                resolve(this)
            }
            else {
                reject(new RequestError(`Creation of ${this.constructor.name} failed with unknown reason.`))
            }
        })
    }
    async checkSeatSectionDependency() {
        let seat
        if (this._id && this.sections) {
            seat = await Database.mongodb.collection(SeatDAO.collection_name).findOne({
                venueId: this._id,
                $nor: this.sections.map(s => {
                    return { $and: [{ "coord.sectX": s.x }, { "coord.sectY": s.y }] }
                })
            })
        }
        return seat
    }
    async update(): Promise<VenueDAO> {
        return new Promise<VenueDAO>(async (resolve, reject) => {
            if (this._id) {
                var dependency = await this.checkSeatSectionDependency()
                if (dependency) {
                    reject(new RequestError(`Update of ${this.constructor.name} with id ${this._id} failed ` +
                        `as seat  with id ${dependency._id} depends on section ${dependency.coord.sectX}-${dependency.coord.sectY}.`)); return
                }
                var result = await Database.mongodb.collection(VenueDAO.collection_name).updateOne({ _id: new ObjectId(this._id) }, { $set: this.Serialize(true) }, { session: this.res.locals.session })
                if (result.modifiedCount > 0) {
                    resolve(this)
                }
                else {
                    reject(new RequestError(`Update of ${this.constructor.name} with id ${this._id} failed with unknown reason.`))
                }
            }
            else {
                reject(new RequestError(`${this.constructor.name}'s id is not initialized.`))
            }
        })
    }
    async checkDependency() {
        var seat = await Database.mongodb.collection(SeatDAO.collection_name).findOne({ venueId: this._id })
        var event = await Database.mongodb.collection(EventDAO.collection_name).findOne({ venueId: this._id })
        return { seat: seat, event: event }
    }
    async delete(): Promise<VenueDAO> {
        return new Promise<VenueDAO>(async (resolve, reject) => {
            this.res.locals.session.startTransaction()
            var dependency = await this.checkDependency()
            if (dependency.event != null || dependency.seat != null) {
                var dependencyType = dependency.event != null ? "event" : "seat"
                var dependencyId = dependency.event != null ? dependency.event._id : dependency.seat?._id
                reject(new RequestError(`Deletation of ${this.constructor.name} with id ${this._id} failed ` +
                    `as ${dependencyType}  with id ${dependencyId} depends on it.`)); return
            }
            if (this._id) {
                var result = await Database.mongodb.collection(VenueDAO.collection_name).deleteOne({ _id: new ObjectId(this._id) }, { session: this.res.locals.session })
                if (result.deletedCount > 0) {

                    resolve(this)
                }
            }
            else { reject(new RequestError(`${this.constructor.name}'s id is not initialized.`)); return }
        })
    }
}
