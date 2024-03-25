import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { ObjectId, WithId, Document, } from "mongodb";
import { EventDAO } from "../dao/event";

export namespace Event {
    export function RouterFactory(): Express.Router {
        var event = Router()
        event.get("/", async (req: Request, res: Response, next) => {
            if (req.query.list != undefined) {
                EventDAO.listAll().then((result: Document[]) => {
                    res.json({ success: true, data: result })
                }).catch((error) => next(error))
            }
        })
        event.get("/:eventId", async (req: Request, res: Response, next) => {
            EventDAO.getById(req.params.eventId).then(result => {
                if (result) res.json({ success: true, data: result.Serialize(false) });
            }).catch((error) => next(error))
        })
        event.post("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.create != undefined) {
                if (req.body.venueId && typeof req.body.venueId == "string") {
                    let venueId = req.body.venueId
                    var dao = new EventDAO({
                        eventname: req.body.eventname,
                        datetime: req.body.datetime,
                        duration: req.body.duration,
                    });
                    dao.venueId = req.body.venueId
                    dao.create().then((value) => {
                        res.json({ success: true })
                    }).catch((error) => next(error))
                }
            }
        })

        event.patch("/:eventId", async (req: Request, res: Response, next): Promise<any> => {
            if (req.params.eventId && typeof req.params.eventId == "string") {
                EventDAO.getById(req.params.eventId).then((dao) => {
                    dao.eventname = req.body.eventname
                    dao.datetime = req.body.datetime
                    dao.duration = req.body.duration
                    dao.venueId = req.body.venueId
                    return dao.update()
                }).then((value) => {
                    res.json({ success: true, data: value.Serialize(false) })
                }).catch((error) => next(error))
            }
        })

        event.delete("/:eventId", async (req: Request, res: Response, next): Promise<any> => {
            EventDAO.getById(req.params.eventId).then(dao => dao.delete().then((value) => {
                res.json({ success: true })
            })).catch((error) => next(error))
        })
        return event
    }
}