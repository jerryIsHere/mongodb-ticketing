import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { Database } from "../dao/database";
import { VenueDAO } from "../dao/venue";
export namespace Venue {
    export function RouterFactory(): Express.Router {
        var venue = Router()

        venue.get("/", async (req: Request, res: Response, next) => {
            if (req.query.list != undefined) {
                return VenueDAO.listAll().then(result => {
                    res.json({ success: true, data: result })
                })
            }
        })
        venue.get("/:venueId", async (req: Request, res: Response, next): Promise<any> => {

        })

        venue.post("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.create != undefined) {
                var dao = new VenueDAO({
                    venuename: req.body.venuename
                })
                return dao.create().then((value) => {
                    res.json({ success: true })
                })
            }
        })

        venue.patch("/:venueId", async (req: Request, res: Response, next): Promise<any> => {
            var dao = await VenueDAO.getById(req.params.venueId)
            dao.venuename = req.body.venuename
            return dao.update().then((value) => {
                res.json({ success: true })
            })
        })

        venue.delete("/:venueId", async (req: Request, res: Response, next): Promise<any> => {
            return (await VenueDAO.getById(req.params.venueId)).delete().then((value) => {
                res.json({ success: true })
            })
        })
        return venue
    };
}