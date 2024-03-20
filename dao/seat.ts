
import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { MongoClient, ObjectId } from "mongodb";
import { Config } from "./config";
import { BaseDAO, Database, RequestError } from "./api";
import { Venue } from "./venue";

export namespace Seat {
    export const collection_name = "seats"
    export function RouterFactory(): Express.Router {
        var seat = Router()

        seat.get("/:seatId", (req: Request, res: Response) => {

        })

        seat.post("/:seatId", (req: Request, res: Response) => {

        })

        seat.patch("/:seatId", (req: Request, res: Response) => {

        })

        seat.delete("/:seatId", (req: Request, res: Response) => {

        })

        seat.put("/:seatId", (req: Request, res: Response) => {

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
        public set venueId(value: ObjectId | undefined) {
            Database.mongodb.collection(Venue.collection_name).findOne({ _id: value }).then(instance => {
                if (instance == null) {
                    throw new RequestError(`Venue with id ${value} doesn't exists.`)
                }
                else {
                    this._venueId = value; BaseDAO.DirtyList.add(this);
                }
            })
        }
        private constructor(
            row: string,
            no: number,
            venueId: ObjectId
        ) {
            super();;
            this.row = row
            this.no = no
            this.venueId = venueId
        }
    }
}