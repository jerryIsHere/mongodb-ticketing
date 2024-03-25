
import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { TicketDAO } from '../dao/ticket'
import { UserDAO } from "../dao/user";
declare module "express-session" {
    interface SessionData {
        user: UserDAO | null;
    }
}

export namespace Ticket {
    export function RouterFactory(): Express.Router {
        var ticket = Router()

        ticket.get("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.eventId && typeof req.query.eventId == "string") {
                TicketDAO.listByEventId(req.query.eventId, (req.session["user"] as any)?._isAdmin).then(result => {
                    res.json({ success: true, data: result  })
                }).catch((error) => next(error))
            }
            else if (req.query.my != undefined && req.session['user'] && (req.session['user'] as any)._id) {
                TicketDAO.ofUser((req.session['user'] as any)._id, (req.session["user"] as any)?._isAdmin).then(result => {
                    res.json({ success: true, data: result })
                }).catch((error) => next(error))
            }
        })

        ticket.get("/:ticketId", async (req: Request, res: Response, next) => {
            TicketDAO.getWithDetailsById(req.params.ticketId, (req.session["user"] as any)?._isAdmin).then(result => {
                res.json({ success: true, data: result })
            }).catch((error) => { next(error) })
        })
        ticket.post("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.create != undefined) {
                if (
                    req.body.eventId && typeof req.body.eventId == "string" &&
                    req.body.seatId && typeof req.body.seatId == "string" &&
                    req.body.priceTierId && typeof req.body.priceTierId == "string"
                ) {
                    var dao = new TicketDAO({});
                    var promises: Promise<any>[] = []
                    dao.eventId = req.body.eventId
                    dao.seatId = req.body.seatId
                    dao.priceTierId = req.body.priceTierId
                    dao.create().then((value) => {
                        res.json({ success: true })
                    }).catch((error) => next(error))

                }
            }
        })
        ticket.patch("/:ticketId", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.buy != undefined && req.session['user'] && (req.session['user'] as any)._id) {
                TicketDAO.getById(req.params.ticketId).then(dao => dao.claim((req.session['user'] as any)._id)).then((value: TicketDAO) => {
                    res.json({ success: true })
                }).catch((error) => next(error))
            }
        })

        ticket.delete("/:ticketId", async (req: Request, res: Response, next): Promise<any> => {
            TicketDAO.getById(req.params.ticketId).then(dao => dao.delete()).then((value) => {
                res.json({ success: true })
            }).catch((error) => { next(error) })
        })
        return ticket
    };

}