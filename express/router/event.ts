import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { ObjectId, WithId, Document, } from "mongodb";
import { EventDAO } from "../dao/event";
import { UserDAO } from "../dao/user";
declare module "express-session" {
    interface SessionData {
        user: UserDAO | null;
    }
}

export namespace Event {
    export function RouterFactory(): Express.Router {
        var event = Router()

        event.use((req: Request, res: Response, next) => {
            if (req.method != 'GET' && (req.session["user"] as any)?._isAdmin != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" })
            }
            else { next() }
        })

        event.get("/", async (req: Request, res: Response, next) => {
            if (req.query.list != undefined) {
                EventDAO.listAll().then((result: Document[]) => {
                    next({ success: true, data: result })
                }).catch((error) => next(error))
            }
            else if (req.query.listSelling != undefined) {
                EventDAO.listSelling().then((result: Document[]) => {
                    next({ success: true, data: result })
                }).catch((error) => next(error))
            }
        })
        event.get("/:eventId", async (req: Request, res: Response, next) => {
            EventDAO.getById(res, req.params.eventId).then(result => {
                if (result) next({ success: true, data: result.Hydrated() });
            }).catch((error) => next(error))
        })
        event.post("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.create != undefined) {
                if (req.body.venueId && typeof req.body.venueId == "string") {
                    let venueId = req.body.venueId
                    var dao = new EventDAO(res, {
                        eventname: req.body.eventname,
                        datetime: req.body.datetime,
                        duration: req.body.duration,
                    });
                    dao.venueId = req.body.venueId
                    dao.create().then((value) => {
                        next({ success: true })
                    }).catch((error) => next(error))
                }
            }
        })

        event.patch("/:eventId", async (req: Request, res: Response, next): Promise<any> => {
            if (req.params.eventId && typeof req.params.eventId == "string") {
                EventDAO.getById(res, req.params.eventId).then((dao) => {
                    dao.eventname = req.body.eventname
                    dao.datetime = req.body.datetime
                    dao.startSellDate = req.body.startSellDate
                    dao.endSellDate = req.body.endSellDate
                    dao.duration = req.body.duration
                    dao.venueId = req.body.venueId
                    return dao.update()
                }).then((value) => {
                    next({ success: true, data: value.Hydrated() })
                }).catch((error) => next(error))
            }
        })

        event.delete("/:eventId", async (req: Request, res: Response, next): Promise<any> => {
            EventDAO.getById(res, req.params.eventId).then(dao => dao.delete().then((value) => {
                next({ success: true })
            })).catch((error) => next(error))
        })
        return event
    }
}