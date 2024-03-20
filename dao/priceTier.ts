import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { MongoClient } from "mongodb";
import { Config } from "./config";
import { BaseDAO, Database, RequestError } from "./api";

export namespace PriceTier {
    export const collection_name = "priceTiers"
    export function RouterFactory(): Express.Router {
        var priceTier = Router()

        priceTier.get("/:priceTierId", (req: Request, res: Response) => {

        })

        priceTier.post("/:priceTierId", (req: Request, res: Response) => {

        })

        priceTier.patch("/:priceTierId", (req: Request, res: Response) => {

        })

        priceTier.delete("/:priceTierId", (req: Request, res: Response) => {

        })

        priceTier.put("/:priceTierId", (req: Request, res: Response) => {

        })
        return priceTier
    };
    export class DAO extends BaseDAO {
        private _tierName: string | undefined
        public get tierName() { return this._tierName }
        public set tierName(value: string | undefined) { this._tierName = value; BaseDAO.DirtyList.add(this); }


        private _price: number | undefined
        public get price() { return this._price }
        public set price(value: number | undefined) {
            if (value && value < 0) {
                throw new RequestError('Price must be greater then 0.')
            }
            else {
                this._price = value; BaseDAO.DirtyList.add(this);
            }
        }

        private constructor(tierName: string, price: number) {
            super();;
            this.tierName = tierName
            this.price = price

        }
    }
}