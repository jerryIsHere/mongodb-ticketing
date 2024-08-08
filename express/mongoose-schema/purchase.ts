//indevelopment, not in use
import { ObjectId, WithId, Document } from "mongodb";
import { Database, RequestError } from "./database";
import { BaseDAO } from "./dao";
import { EventDAO } from './event';
import { PriceTierDAO } from "./priceTier";
import { SeatDAO } from "./seat";
import { UserDAO } from "./user";
import { Response } from "express";
export type PurchaseChangeLog = {
    isEmailSent: boolean
    desc: string
}

export class PurchaseDAO extends BaseDAO {
    public static readonly collection_name = "purchases"
    private _ticketIds: Array<ObjectId> = new Array<ObjectId>()
    public get ticketIds() { return this._ticketIds }
    private set ticketIds(value: Array<ObjectId | string> | string | undefined) {
        if (Array.isArray(value)) {
            function isObjectIdArray(arr: Array<any>): arr is Array<ObjectId> {
                return arr.every(it => it instanceof ObjectId)
            }
            if (isObjectIdArray(value)) {
                this._ticketIds = value;
            }
            else {
                this._ticketIds = value.filter(it => typeof it === "string").map(it => new ObjectId(it));
            }
        }
        else if (typeof value === "string") {
            this._ticketIds?.push(new ObjectId(value))
        }
    }

    private _purchaserId?: ObjectId | undefined
    public get purchaserId(): ObjectId | undefined { return this._purchaserId }


    private _logs?: PurchaseChangeLog[] | undefined
    public get logs(): PurchaseChangeLog[] | undefined { return this._logs }
    private set logs(value: PurchaseChangeLog[] | undefined) {
        if (Array.isArray(value)) {
            function isPurchaseChangeLogArray(arr: Array<any>): arr is Array<PurchaseChangeLog> {
                return arr.every(it => typeof it.isEmailSent === "boolean" && typeof it.desc === "string")
            }
            if (isPurchaseChangeLogArray(value)) {
                this._logs = value;
            }
        }
        else if (typeof value === "string") {
            this._ticketIds?.push(new ObjectId(value))
        }
    }

    private _perchaserId?: ObjectId | undefined | null = null
    public get perchaserId(): ObjectId | undefined | null { return this._perchaserId }


}