import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { Database } from "../dao/database";
import { VenueDAO } from "../dao/venue";
export namespace Venue {
    export function RouterFactory(): Express.Router {
        var venue = Router()

        venue.get("/", async (req: Request, res: Response, next) => {
            try {
                if (req.query.list != undefined) {
                    return VenueDAO.listAll().then(result => {
                        res.json({ success: true, data: result })
                    })
                }
            }
            catch (error) {
                next(error)
            }
        })
        venue.get("/:venueId", async (req: Request, res: Response, next): Promise<any> => {

        })

        venue.post("/", async (req: Request, res: Response, next): Promise<any> => {
            try {
                if (req.query.create != undefined) {
                    var dao = new VenueDAO({
                        venuename: req.body.venuename
                    })
                    return dao.create().then((value) => {
                        res.json({ success: true })
                    })
                }
            }
            catch (error) {
                next(error)
            }
        })

        venue.patch("/:venueId", async (req: Request, res: Response, next): Promise<any> => {
            try {
                var dao = await VenueDAO.getById(req.params.venueId)
                dao.venuename = req.body.venuename
                return dao.update().then((value) => {
                    res.json({ success: true })
                })
            }
            catch (error) {
                next(error)
            }
        })

        venue.delete("/:venueId", async (req: Request, res: Response, next): Promise<any> => {
            try {
                VenueDAO.getById(req.params.venueId).then(dao => dao.delete().then((value) => {
                    res.json({ success: true })
                }))
            }
            catch (error) {
                next(error)
            }
        })
        return venue
    };
}