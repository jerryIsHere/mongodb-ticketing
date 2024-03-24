import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { ObjectId, WithId, Document, } from "mongodb";
import { EventDAO } from "../dao/event";

export namespace Event {
    export function RouterFactory(): Express.Router {
        var event = Router()
        event.get("/", (req: Request, res: Response) => {
            if (req.query.list != undefined) {
                return EventDAO.listAll().then((result: Document[]) => {
                    res.json({ success: true, data: result })
                })
            }
        })
        event.get("/:eventId", (req: Request, res: Response) => {
            return EventDAO.getById(req.params.eventId).then(result => {
                if (result) res.json({ success: true, data: result });
            })
        })
        event.post("/", async (req: Request, res: Response) : Promise<any> => {
            if (req.query.create != undefined) {
                if (req.body.venueId && typeof req.body.venueId == "string") {
                    let venueId = req.body.venueId
                    var dao = new EventDAO({
                        eventname: req.body.eventname,
                        datetime: req.body.datetime,
                        duration: req.body.duration,
                    });
                    await dao.setVenueId(new ObjectId(venueId))
                    dao.create().then((value) => {
                        res.json({ success: true })
                    })
                }
            }
        })

        event.patch("/:eventId", async (req: Request, res: Response) : Promise<any> => {
            if (req.params.eventId && typeof req.params.eventId == "string") {
                var dao = await EventDAO.getById(req.body.venueId)
                dao.eventname = req.body.eventname
                dao.datetime = req.body.datetime
                dao.duration = req.body.duration
                return (await dao.setVenueId(new ObjectId(req.body.venueId))).update().then((value) => {
                    res.json({ success: true, data: value.Serialize(false) })
                })
            }
        })

        event.delete("/:eventId", async (req: Request, res: Response) : Promise<any> => {
            return (await EventDAO.getById(req.params.eventId)).delete().then((value) => {
                res.json({ success: true })
            })
        })
        return event
    }
}