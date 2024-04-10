import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"

import { PriceTierDAO } from "../dao/priceTier"
import { UserDAO } from "../dao/user";

export namespace PriceTier {
    export function RouterFactory(): Express.Router {
        var priceTier = Router()

        priceTier.use((req: Request, res: Response, next) => {
            if (req.method != 'GET' && (req.session["user"] as any)?._isAdmin != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" })
            }
            else { next() }
        })

        priceTier.get("/", async (req: Request, res: Response, next) => {
            if (req.query.list != undefined) {
                PriceTierDAO.listAll(res, ).then(result => {
                    next({ success: true, data: result.map(dao => dao.Hydrated())  })
                }).catch((error) => next(error))
            }
        })
        priceTier.get("/:priceTierId", async (req: Request, res: Response, next) => {

        })

        priceTier.post("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.create != undefined) {
                if (req.body.tierName && req.body.price) {
                    var dao = new PriceTierDAO(res, {
                        tierName: req.body.tierName,
                        price: req.body.price,
                    })
                    dao.create().then((value) => {
                        next({ success: true })
                    }).catch((error) => next(error))
                }
            }
        })

        priceTier.patch("/:priceTierId", async (req: Request, res: Response, next): Promise<any> => {
            if (req.body.tierName && req.body.price) {
                PriceTierDAO.getById(res, req.params.priceTierId).then(dao => {
                    dao.tierName = req.body.tierName
                    dao.price = req.body.price
                    return dao.update()
                }).then((value) => {
                    next({ success: true })
                }).catch((error) => next(error))
            }
        })

        priceTier.delete("/:priceTierId", async (req: Request, res: Response, next): Promise<any> => {
            PriceTierDAO.getById(res, req.params.priceTierId).then(dao => dao.delete().then((value) => {
                next({ success: true })
            })).catch((error) => next(error))
        })

        return priceTier
    }
}