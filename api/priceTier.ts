import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"

import { PriceTierDAO } from "../dao/priceTier"

export namespace PriceTier {
    export function RouterFactory(): Express.Router {
        var priceTier = Router()

        priceTier.get("/", async (req: Request, res: Response, next) => {
            if (req.query.list != undefined) {
                PriceTierDAO.listAll().then(result => {
                    res.json({ success: true, data: result })
                }).catch((error) => next(error))
            }
        })
        priceTier.get("/:priceTierId", async (req: Request, res: Response, next) => {

        })

        priceTier.post("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.create != undefined) {
                if (req.body.tierName && req.body.price) {
                    var dao = new PriceTierDAO({
                        tierName: req.body.tierName,
                        price: req.body.price,
                    })
                    dao.create().then((value) => {
                        res.json({ success: true })
                    }).catch((error) => next(error))
                }
            }
        })

        priceTier.patch("/:priceTierId", async (req: Request, res: Response, next): Promise<any> => {
            if (req.body.tierName && req.body.price) {
                PriceTierDAO.getById(req.params.priceTierId).then(dao => {
                    dao.tierName = req.body.tierName
                    dao.price = req.body.price
                    return dao.update()
                }).then((value) => {
                    res.json({ success: true })
                }).catch((error) => next(error))
            }
        })

        priceTier.delete("/:priceTierId", async (req: Request, res: Response, next): Promise<any> => {
            PriceTierDAO.getById(req.params.priceTierId).then(dao => dao.delete().then((value) => {
                res.json({ success: true })
            })).catch((error) => next(error))
        })

        return priceTier
    }
}