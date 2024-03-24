
import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { SeatDAO } from "../dao/seat";

export namespace Seat {
    export function RouterFactory(): Express.Router {
        var seat = Router()

        seat.get("/", (req: Request, res: Response) => {
            if (req.query.venueId && typeof req.query.venueId == "string") {
                return SeatDAO.listByVenueId(req.query.venueId).then(result => {
                    res.json({ success: true, data: result })
                })
            }
        })
        seat.post("/", async (req: Request, res: Response) : Promise<any> => {
            if (req.query.venueId && typeof req.query.venueId == "string") {
                let venueId = req.query.venueId
                if (req.query.batch != undefined && req.body.seats && Array.isArray(req.body.seats)) {
                    let promises: Promise<SeatDAO>[] = []
                    req.body.seats.forEach((seat: { row: string, no: string }) => {
                        var dao = new SeatDAO({
                            row: seat.row,
                            no: Number(seat.no),
                        })
                        promises.push(
                            dao.setVenueId(venueId).then(_ => dao.create())
                        )
                    })
                    return Promise.all(promises).then((seats: SeatDAO[]) => {
                        res.json({ success: true, data: seats.map(seat => seat.Serialize(false)) })
                    })
                }
            }
        })
        seat.patch("/:seatId", async (req: Request, res: Response) : Promise<any> => {
            if (req.body.tierName && req.body.price) {
                var dao = new SeatDAO({})
                return dao.update().then((value) => {
                    res.json({ success: true })
                })
            }
        })
        seat.delete("/:seatId", async (req: Request, res: Response) : Promise<any> => {
            return (await SeatDAO.getById(req.params.priceTierId)).delete().then((value) => {
                res.json({ success: true })
            })
        })
        return seat
    }
}