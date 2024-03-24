import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { Database } from "../dao/database";
import { VenueDAO } from "../dao/venue";
export namespace Venue {
    export function RouterFactory(): Express.Router {
        var venue = Router()

        venue.get("/", (req: Request, res: Response) => {
            if (req.query.list != undefined) {
                return VenueDAO.listAll().then(result => {
                    res.json({ success: true, data: result })
                })
            }
        })
        venue.get("/:venueId", async (req: Request, res: Response): Promise<any> => {

        })

        venue.post("/", async (req: Request, res: Response): Promise<any> => {
            if (req.query.create != undefined) {
                var dao = new VenueDAO({
                    venuename: req.body.venuename
                })
                return dao.create().then((value) => {
                    res.json({ success: true })
                })
            }
        })

        venue.patch("/:venueId", async (req: Request, res: Response): Promise<any> => {
            var dao = await VenueDAO.getById(req.body.venueId)
            dao.venuename = req.body.venuename
            return dao.update().then((value) => {
                res.json({ success: true })
            })
        })

        venue.delete("/:venueId", async (req: Request, res: Response): Promise<any> => {
            return (await VenueDAO.getById(req.params.priceTierId)).delete().then((value) => {
                res.json({ success: true })
            })
        })
        return venue
    };
}