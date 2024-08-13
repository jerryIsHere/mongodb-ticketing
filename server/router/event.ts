import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { ModifyResult, Document } from "mongoose";
import { v1 } from '~/mongoose-schema/schema'
import { IEvent } from "~/mongoose-schema/v1/event";


export namespace Event {
    export function RouterFactory(): Express.Router {
        var event = Router()

        event.use((req: Request, res: Response, next) => {
            if (req.method != 'GET' && (req.session["user"] as any)?.hasAdminRight != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" })
            }
            else { next() }
        })

        event.get("/", async (req: Request, res: Response, next) => {
            if (req.query.list != undefined) {
                next({ success: true, data: await v1.Event.eventModel.find().lean().exec() })
            }
            else if (req.query.listSelling != undefined) {
                next({ success: true, data: await v1.Event.eventModel.find().findSelling().lean().exec() })
            }
        })
        event.get("/:eventId", async (req: Request, res: Response, next) => {
            next({ success: true, data: await v1.Event.eventModel.findById(req.params.eventId).lean().exec() })
        })
        event.post("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.create != undefined) {
                if (req.body.venueId && typeof req.body.venueId == "string") {
                    let venueId = req.body.venueId
                    var eventDoc = new v1.Event.eventModel({
                        eventname: req.body.eventname,
                        datetime: req.body.datetime,
                        duration: req.body.duration,
                        saleInfos: req.body.saleInfos,
                        shoppingCartSize: req.body.shoppingCartSize,
                        venueId: req.body.venueId
                    });
                    await eventDoc.save().catch((err) => next(err))
                    next({ success: true })
                }
            }
        })

        event.patch("/:eventId", async (req: Request, res: Response, next): Promise<any> => {
            if (req.params.eventId && typeof req.params.eventId == "string") {
                let eventDoc = await v1.Event.eventModel.findByIdAndUpdate(req.params.eventId, req.body
                    , { returnDocument: "after", lean: true }).exec().catch((err) => next(err))
                next({ success: true, data: eventDoc })
            }
        })

        event.delete("/:eventId", async (req: Request, res: Response, next): Promise<any> => {
            let deleteResult = await v1.Event.eventModel.findByIdAndDelete(req.params.eventId,
                { includeResultMetadata: true }).exec().catch((err) => next(err))
            if (deleteResult && deleteResult.ok)  {
                next({ success: true })
            }
            else {
                next({ success: false })
            }
        })
        return event
    }
}