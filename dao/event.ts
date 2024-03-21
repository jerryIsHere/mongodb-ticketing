import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { MongoClient, ObjectId, WithId, Document, } from "mongodb";
import { Config } from "./config";
import { BaseDAO, Database, RequestError } from "./api";
import { Venue } from "./venue";

export namespace Event {
    export const collection_name = "events"
    export function RouterFactory(): Express.Router {
        var event = Router()

        event.get("/", (req: Request, res: Response) => {
            if (req.query.list != undefined) {
                var cursor = Database.mongodb.collection(collection_name).aggregate([
                    {
                        $lookup:
                        {
                            from: Venue.collection_name,
                            localField: "venueId",
                            foreignField: "_id",
                            as: "venue",
                        }
                    },
                    { $set: { 'venue': { $first: '$venue' } } }
                ])
                let result: Object[] = []
                cursor.forEach(doc => {
                    result.push(doc)
                }).then(_ => {
                    res.json({ success: true, data: result })
                })
            }
        })
        event.post("/", (req: Request, res: Response) => {
            if (req.query.create != undefined) {
                if (req.body.venueId && typeof req.body.venueId == "string") {
                    let venueId = req.body.venueId
                    var dao = new DAO({
                        eventname: req.body.eventname,
                        datetime: req.body.datetime,
                        duration: req.body.duration,
                    })
                    dao.setVenueId(new ObjectId(venueId)).then(_ => Database.mongodb.collection(collection_name).insertOne(dao.Serialize(true)).then((value) => {
                        if (value.acknowledged) {
                            res.json({ success: true })
                        }
                    }))
                }
            }
        })

        event.patch("/:eventId", async (req: Request, res: Response) => {
            if (req.query.venueId && typeof req.query.venueId == "string") {
                var dao = new DAO({
                    eventname: req.body.eventname,
                    datetime: req.body.datetime,
                    duration: req.body.duration,
                })
                return dao.setVenueId(new ObjectId(req.query.venueId))
                    .then(_ => Database.mongodb.collection(collection_name)
                        .updateOne({ _id: new ObjectId(req.params.priceTierId) }, { $set: dao.Serialize(true) },).then((value) => {
                            if (value.acknowledged) {
                                res.json({ success: true })
                            }
                        }))
            }

        })

        event.delete("/:eventId", (req: Request, res: Response) => {
            return Database.mongodb.collection(collection_name).deleteOne({ _id: new ObjectId(req.params.eventId) }).then((value) => {
                if (value.acknowledged) {
                    res.json({ success: true })
                }
            })

        })
        return event
    };
    export class DAO extends BaseDAO {
        private _eventname: string | undefined
        public get eventname() { return this._eventname }
        public set eventname(value: string | undefined) { this._eventname = value; BaseDAO.DirtyList.add(this); }

        private _datetime: Date | undefined
        public get datetime() { return this._datetime }
        public set datetime(value: Date | undefined) { this._datetime = value; BaseDAO.DirtyList.add(this); }

        private _duration: number | undefined
        public get duration() { return this._duration }
        public set duration(value: number | undefined) {
            if (value && value < 0) {
                throw new RequestError('Duration must be greater then 0.')
            }
            else {
                this._duration = value; BaseDAO.DirtyList.add(this);
            }
        }

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
            eventname: string,
            datetime: Date,
            duration: number,
        } & { doc?: WithId<Document> }
        ) {
            super(params.doc && params.doc._id ? params.doc._id : undefined);
            if (params.doc && params.doc._id) {


                this._eventname = params.doc.eventname
                this._datetime = params.doc.datetime
                this._duration = params.doc.duration
                this._venueId = params.doc.venueId
            }
            if (params.eventname)
                this.eventname = params.eventname

            if (params.datetime)
                this.datetime = params.datetime

            if (params.duration)
                this.duration = params.duration
        }
    }
}

