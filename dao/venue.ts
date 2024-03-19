import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { MongoClient } from "mongodb";
import { Config } from "./config";
import { BaseDAO, Database } from "./database";

export namespace Venue {
    export const collection_name = "venues"
    export function RouterFactory(): Express.Router {
        var venue = Router()

        venue.get("/:venueId", (req: Request, res: Response) => {

        })

        venue.post("/:venueId", (req: Request, res: Response) => {

        })

        venue.patch("/:venueId", (req: Request, res: Response) => {

        })

        venue.delete("/:venueId", (req: Request, res: Response) => {

        })

        venue.put("/:venueId", (req: Request, res: Response) => {

        })
        return venue
    };
    export class DAO extends BaseDAO {
        private _venuename: string
        public get venuename() { return this._venuename }
        public set venuename(value: string) { this._venuename = value; Database.DirtyDAO.add(this); }

        private constructor(venuename: string) {
            super(collection_name);;
            this._venuename = venuename
        }
    }
}