
import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { EventSeatDAO } from '../dao/eventSeat'
import { UserDAO } from "../dao/user";
declare module "express-session" {
    interface SessionData {
        user: UserDAO | null;
    }
}

export namespace EventSeat {
    export function RouterFactory(): Express.Router {
        var ticket = Router()

        ticket.get("/", async (req: Request, res: Response) : Promise<any> => {
            if (req.query.eventId && typeof req.query.eventId == "string") {
                return EventSeatDAO.listByEventId(req.query.eventId, (req.session["user"] as any)?._isAdmin).then(result => {
                    res.json({ success: true, data: result })
                })
            }
            else if (req.query.my != undefined && req.session['user'] && (req.session['user'] as any)._id) {
                return EventSeatDAO.ofUser((req.session['user'] as any)._id, (req.session["user"] as any)?._isAdmin).then(result => {
                    res.json({ success: true, data: result })
                })
            }
        })

        ticket.get("/:ticketId", (req: Request, res: Response) => {
            return EventSeatDAO.getWithDetailsById(req.params.ticketId, (req.session["user"] as any)?._isAdmin).then(result => {
                res.json({ success: true, data: result })
            })
        })
        ticket.post("/", async (req: Request, res: Response) : Promise<any> => {
            if (req.query.create != undefined) {
                if (
                    req.body.eventId && typeof req.body.eventId == "string" &&
                    req.body.seatId && typeof req.body.seatId == "string" &&
                    req.body.priceTierId && typeof req.body.priceTierId == "string"
                ) {
                    var dao = new EventSeatDAO({});
                    var promises: Promise<any>[] = []
                    await dao.setEventId(req.body.eventId)
                    await dao.setSeatId(req.body.seatId)
                    await dao.setPriceTierId(req.body.priceTierId)
                    return dao.create().then((value) => {
                        res.json({ success: true })
                    })

                }
            }
        })
        ticket.patch("/:ticketId", async (req: Request, res: Response) : Promise<any> => {
            if (req.query.buy != undefined && req.session['user'] && (req.session['user'] as any)._id) {
                var dao = await EventSeatDAO.getById(req.params.ticketId);
                return dao.claim((req.session['user'] as any)._id).then((value: EventSeatDAO) => {
                    res.json({ success: true })
                })
            }
        })

        ticket.delete("/:ticketId", async (req: Request, res: Response) : Promise<any> => {
            return (await EventSeatDAO.getById(req.params.eventId)).delete().then((value) => {
                res.json({ success: true })
            })

        })
        return ticket
    };

}