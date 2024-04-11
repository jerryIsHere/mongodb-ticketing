import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { Database, RequestError } from "../dao/database";
import { VenueDAO, sectionType, sectionTypeCheck } from "../dao/venue";
import { UserDAO } from "../dao/user";
export namespace Venue {
    export function RouterFactory(): Express.Router {
        var venue = Router()

        venue.use((req: Request, res: Response, next) => {
            if (req.method != 'GET' && (req.session["user"] as any)?.hasAdminRight != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" })
            }
            else { next() }
        })

        venue.get("/", async (req: Request, res: Response, next) => {
            if (req.query.list != undefined) {
                VenueDAO.listAll(res, ).then(result => {
                    next({ success: true, data: result.map(dao => dao.Hydrated()) })
                }).catch((error) => next(error))
            }
        })
        venue.get("/:venueId", async (req: Request, res: Response, next): Promise<any> => {
            VenueDAO.getById(res, req.params.venueId).then(result => {
                if (result) next({ success: true, data: result.Hydrated() });
            }).catch((error) => next(error))
        })

        venue.post("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.create != undefined && req.body.venuename && req.body.sections) {
                if (req.body.sections.filter((s: sectionType) => !sectionTypeCheck(s)).length > 0)
                    return next(new RequestError("Requested sections is not in correct format"))
                var dao = new VenueDAO(res, {
                    venuename: req.body.venuename,
                    sections: req.body.sections
                })
                dao.create().then((value) => {
                    next({ success: true })
                }).catch((error) => next(error))
            }
        })

        venue.patch("/:venueId", async (req: Request, res: Response, next): Promise<any> => {
            if (req.body.venuename) {
                if (req.body.sections.filter((s: sectionType) => !sectionTypeCheck(s)).length > 0)
                    return next(new RequestError("Requested sections is not in correct format"))
                VenueDAO.getById(res, req.params.venueId).then(dao => {
                    dao.venuename = req.body.venuename
                    dao.sections = req.body.sections
                    return dao.update()
                }).then((value) => {
                    next({ success: true })
                }).catch((error) => next(error))
            }
        })

        venue.delete("/:venueId", async (req: Request, res: Response, next): Promise<any> => {
            VenueDAO.getById(res, req.params.venueId).then(dao => dao.delete()).then((value) => {
                next({ success: true })
            }).catch((error) => next(error))
        })
        return venue
    };
}