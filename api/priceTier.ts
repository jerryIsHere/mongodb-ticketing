import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"

import { PriceTierDAO } from "../dao/priceTier"

export namespace PriceTier {
    export function RouterFactory(): Express.Router {
        var priceTier = Router()

        priceTier.get("/", (req: Request, res: Response) => {
            if (req.query.list != undefined) {
                return PriceTierDAO.listAll().then(result => {
                    res.json({ success: true, data: result })
                })
            }
        })
        priceTier.get("/:priceTierId", (req: Request, res: Response) => {

        })

        priceTier.post("/", async (req: Request, res: Response) : Promise<any> => {
            if (req.query.create != undefined) {
                if (req.body.tierName && req.body.price) {
                    var dao = new PriceTierDAO({
                        tierName: req.body.tierName,
                        price: req.body.price,
                    })
                    return dao.create().then((value) => {
                        res.json({ success: true })
                    })
                }
            }
        })

        priceTier.patch("/:priceTierId", async (req: Request, res: Response) : Promise<any> => {
            if (req.body.tierName && req.body.price) {
                var dao = await PriceTierDAO.getById(req.body.venueId)
                dao.tierName = req.body.eventntierNameame
                dao.price = req.body.price
                return dao.update().then((value) => {
                    res.json({ success: true })
                })
            }
        })

        priceTier.delete("/:priceTierId", async (req: Request, res: Response) : Promise<any> => {
            return (await PriceTierDAO.getById(req.params.priceTierId)).delete().then((value) => {
                res.json({ success: true })
            })
        })

        return priceTier
    }
}