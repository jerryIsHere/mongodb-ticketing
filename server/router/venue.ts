import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { Database, RequestError } from "../database/database";
import { v1 } from '../../mongoose-schema/schema'
import { venueModel } from "../../mongoose-schema/v1/venue";
export namespace Venue {
    export function RouterFactory(): Express.Router {
        var venue = Router()

        venue.use((req: Request, res: Response, next) => {
            if (req.method != 'GET' && (req.session["user"] as any)?.hasAdminRight != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" })
            }
            else { next() }
        })

        venue.get("/", async (req: Request, res: Response, next) => {
            if (req.query.list != undefined) {
                next({ success: true, data: await venueModel.find().lean().exec() })
            }
        })
        venue.get("/:venueId", async (req: Request, res: Response, next): Promise<any> => {
            next({ success: true, data: await venueModel.findById(req.params.venueId).lean().exec() })
        })

        venue.post("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.create != undefined && req.body.venuename && req.body.sections) {
                var eventDoc = new venueModel({
                    venuename: req.body.venuename,
                    sections: req.body.sections
                });
                await eventDoc.save().catch((err) => next(err))
                next({ success: true })
            }
        })

        venue.patch("/:venueId", async (req: Request, res: Response, next): Promise<any> => {
            if (req.body.venuename && req.body.sections) {
                let eventDoc = await venueModel.findByIdAndUpdate(req.params.venueId, req.body
                    , { returnDocument: "after", lean: true }).exec().catch((err) => next(err))
                next({ success: true, data: eventDoc })
            }
        })

        venue.delete("/:venueId", async (req: Request, res: Response, next): Promise<any> => {
            let deleteResult = await venueModel.findByIdAndDelete(req.params.eventId,
                { includeResultMetadata: true }).exec().catch((err) => next(err))
            if (deleteResult && deleteResult.ok)  {
                next({ success: true })
            }
            else {
                next({ success: false })
            }
        })
        return venue
    };
}