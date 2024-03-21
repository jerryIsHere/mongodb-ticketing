
import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { MongoClient, ObjectId, WithId, Document, InsertOneResult } from "mongodb";
import { Config } from "./config";
import { BaseDAO, Database, RequestError } from "./api";
import { Venue } from "./venue";

export namespace Seat {
    export const collection_name = "seats"
    export function RouterFactory(): Express.Router {
        var seat = Router()

        seat.get("/", (req: Request, res: Response) => {
            if (req.query.venueId && typeof req.query.venueId == "string") {
                var cursor = Database.mongodb.collection(collection_name).find({ venueId: new ObjectId(req.query.venueId) })
                let result: Object[] = []
                cursor.forEach(doc => {
                    result.push(doc)
                }).then(_ => {
                    res.json({ success: true, data: result })
                })
            }
        })
        seat.post("/", async (req: Request, res: Response) => {
            if (req.query.venueId && typeof req.query.venueId == "string") {
                let venueId = req.query.venueId
                if (req.query.batch != undefined && req.body.seats && Array.isArray(req.body.seats)) {
                    let promises: Promise<boolean>[] = []
                    req.body.seats.forEach((seat: { row: string, no: string }) => {
                        var dao = new DAO({
                            row: seat.row,
                            no: Number(seat.no),
                        })
                        promises.push(
                            dao.setVenueId(new ObjectId(venueId)).then(_ => Database.mongodb.collection(collection_name).insertOne(dao.Serialize(true)).then((value) => {
                                if (value.insertedId) return true
                                throw new RequestError("unkown error")
                            }))
                        )
                    })
                    return Promise.all(promises).then(result => {
                        res.json({ success: true })
                    })
                }
                // var dao = new DAO({
                //     venueId: new ObjectId(venueId),
                //     row: req.params.row,
                //     no: Number(req.params.no),
                // })
                // return Database.mongodb.collection(collection_name).insertOne(dao.Serialize(true)).then((value) => {
                //     if (value.acknowledged) {
                //         res.json({ success: true })
                //     }
                // })
            }

        })


        seat.delete("/:seatId", (req: Request, res: Response) => {
            return Database.mongodb.collection(collection_name).deleteOne({ _id: new ObjectId(req.params.seatId) }).then((value) => {
                if (value.deletedCount > 0) {
                    res.json({ success: true })
                }
            })
        })
        return seat
    };
    export class DAO extends BaseDAO {
        private _row: string | undefined
        public get row() { return this._row }
        public set row(value: string | undefined) { this._row = value; BaseDAO.DirtyList.add(this); }

        private _no: number | undefined
        public get no() { return this._no }
        public set no(value: number | undefined) { this._no = value; BaseDAO.DirtyList.add(this); }

        private _venueId: ObjectId | undefined
        public get venueId() { return this._venueId }
        public async setVenueId(value: ObjectId | undefined) {
            return Database.mongodb.collection(Venue.collection_name).findOne({ _id: value }).then(instance => {
                if (instance == null) {
                    throw new RequestError(`Venue with id ${value} doesn't exists.`)
                }
                else {
                    this._venueId = value; BaseDAO.DirtyList.add(this);
                }
            })
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
    }
}