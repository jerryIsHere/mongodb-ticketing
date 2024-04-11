
import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { SeatDAO, coordType, coordTypeCheck } from "../dao/seat";
import { UserDAO } from "../dao/user";

export namespace Seat {
    export function RouterFactory(): Express.Router {
        var seat = Router()

        seat.use((req: Request, res: Response, next) => {
            if (req.method != 'GET' && (req.session["user"] as any)?.hasAdminRight != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" })
            }
            else { next() }
        })

        seat.get("/", async (req: Request, res: Response, next) => {
            if (req.query.venueId && typeof req.query.venueId == "string") {
                SeatDAO.listByVenueId(res, req.query.venueId).then(result => {
                    next({ success: true, data: result.map(dao => dao.Hydrated()) })
                }).catch((error) => next(error))
            }
        })
        seat.post("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.venueId && typeof req.query.venueId == "string") {
                let venueId = req.query.venueId
                if (req.query.batch != undefined && req.body.seats && Array.isArray(req.body.seats)) {
                    type seatType = { no: number, row: string, coord: coordType }
                    var SeatTypeCheck = (s: seatType): s is seatType => {
                        return typeof s.no == "number" &&
                            typeof s.row == "string" &&
                            s.coord &&
                            coordTypeCheck(s.coord)
                    }
                    var daos: SeatDAO[] = req.body.seats.filter((s: seatType) => SeatTypeCheck(s)).map((s: any) => {
                        var dao = new SeatDAO(res, {
                            row: s.row,
                            no: Number(s.no),
                            coord: s.coord
                        })
                        dao.venueId = venueId
                        return dao;
                    })
                    SeatDAO.batchCreate(res, daos).then((seats: SeatDAO[]) => {
                        next({ success: true, data: seats.map(seat => seat.Hydrated()) })
                    }).catch((error) => next(error))
                }
            }
        })
        seat.patch("/:seatId", async (req: Request, res: Response, next): Promise<any> => {
            if (req.body.coord) {
                var dao = await SeatDAO.getById(res, req.params.seatId)
                dao.coord = req.body.coord
                dao.update().then((seat: SeatDAO) => {
                    next({ success: true, data: seat.Hydrated() })
                }).catch((error) => next(error))
            }
        })
        seat.delete("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.batch != undefined && req.body.seatIds && Array.isArray(req.body.seatIds)) {
                SeatDAO.getByIds(res, req.body.seatIds).then(daos => SeatDAO.batchDelete(res, daos)).then((seats: SeatDAO[]) => {
                    next({ success: true, data: seats.map(seat => seat.Hydrated()) })
                }).catch((error) => next(error))
            }
        })
        seat.delete("/:seatId", async (req: Request, res: Response, next): Promise<any> => {
            SeatDAO.getById(res, req.params.seatId).then(dao => dao.delete().then((value) => {
                next({ success: true })
            })).catch((error) => { next(error) })
        })
        return seat
    }
}