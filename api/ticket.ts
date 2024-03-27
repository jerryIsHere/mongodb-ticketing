
import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { TicketDAO } from '../dao/ticket'
import { UserDAO } from "../dao/user";
import { RequestError } from "../dao/database";
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
                    res.json({ success: true, data: result })
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
                if (req.query.batch != undefined && req.body.tickets && Array.isArray(req.body.tickets)) {
                    var daos: TicketDAO[] = req.body.tickets.map((t: any) => {
                        var dao = new TicketDAO({})
                        dao.eventId = t.eventId
                        dao.seatId = t.seatId
                        dao.priceTierId = t.priceTierId
                        return dao;
                    })
                    TicketDAO.batchCreate(daos).then((tickets: TicketDAO[]) => {
                        res.json({ success: true, data: tickets.map(ticket => ticket.Hydrated()) })
                    }).catch((error) => next(error))
                }
                else if (
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
        ticket.patch("", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.batch != undefined && req.body.ticketIds && Array.isArray(req.body.ticketIds)) {
                if (req.query.buy != undefined) {
                    TicketDAO.getByIds(req.body.ticketIds).then(daos => TicketDAO.batchClaim(daos, (req.session['user'] as any)._id)).then((tickets: TicketDAO[]) => {
                        res.json({ success: true, data: tickets.map(ticket => ticket.Hydrated()) })
                    }).catch((error) => next(error))
                }
                else if (req.query.priceTier === "string") {
                    TicketDAO.getByIds(req.body.ticketIds).then(daos => {
                        if (req.query.priceTier === "string") {
                            return TicketDAO.batchUdatePriceTier(daos, req.query.priceTier)
                        }
                        else {
                            next(new RequestError(`${req.query.priceTier} is not of type string`))
                            return []
                        }
                    }
                    ).then((tickets: TicketDAO[]) => {
                        res.json({ success: true, data: tickets.map(ticket => ticket.Hydrated()) })
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
            if (req.query.payment != undefined && req.body.paid != undefined &&
                (req.body.paymentRemark == undefined || req.body.paymentRemark == null || typeof req.body.paymentRemark == "string") &&
                req.session['user'] &&
                (req.session['user'] as any)._isAdmin) {
                TicketDAO.getById(req.params.ticketId).then(dao => { dao.paid = req.body.paid; dao.paymentRemark = req.body.paymentRemark; return dao.update() }).then((value: TicketDAO) => {
                    res.json({ success: true })
                }).catch((error) => next(error))
            }
        })

        ticket.delete("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.batch != undefined && req.body.ticketIds && Array.isArray(req.body.ticketIds)) {
                TicketDAO.getByIds(req.body.ticketIds).then(daos => TicketDAO.batchDelete(daos)).then((tickets: TicketDAO[]) => {
                    res.json({ success: true, data: tickets.map(ticket => ticket.Hydrated()) })
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