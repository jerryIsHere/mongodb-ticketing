import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { MongoClient, ObjectId } from "mongodb";
import { Config } from "./config";
import { BaseDAO, Database, RequestError } from "./database";
import { Venue } from "./venue";

export namespace Event {
    export const collection_name = "events"
    export function RouterFactory(): Express.Router {
        var event = Router()

        event.get("/:eventId", (req: Request, res: Response) => {

        })

        event.post("/:eventId", (req: Request, res: Response) => {

        })

        event.patch("/:eventId", (req: Request, res: Response) => {

        })

        event.delete("/:eventId", (req: Request, res: Response) => {

        })

        event.put("/:eventId", (req: Request, res: Response) => {

        })
        return event
    };
    export class DAO extends BaseDAO {
        private _eventname: string
        public get eventname() { return this._eventname }
        public set eventname(value: string) { this._eventname = value; Database.DirtyDAO.add(this); }

        private _datetime: Date
        public get datetime() { return this._datetime }
        public set datetime(value: Date) { this._datetime = value; Database.DirtyDAO.add(this); }

        private _duration: number
        public get duration() { return this._duration }
        public set duration(value: number) {
            if (value < 0) {
                throw new Error('Duration must be greater then 0.')
            }
            else {
                this._duration = value; Database.DirtyDAO.add(this);
            }
        }

        private _venueId: ObjectId
        public get venueId() { return this._venueId }
        public set venueId(value: ObjectId) {
            Database.mongodb.collection(Venue.collection_name).findOne({ _id: value }).then(instance => {
                if (instance == null) {
                    throw new RequestError(`Venue with id ${value} doesn't exists.`)
                }
                else {
                    this._venueId = value; Database.DirtyDAO.add(this);
                }
            })
        }

        private constructor(
            eventname: string,
            datetime: Date,
            duration: number,
            venueId: ObjectId
        ) {
            super(collection_name);;
            this._eventname = eventname
            this._datetime = datetime
            this._duration = duration
            this._venueId = venueId
        }
    }
}

