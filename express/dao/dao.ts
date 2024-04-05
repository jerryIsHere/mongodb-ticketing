import { ObjectId } from "mongodb";
import { RequestError } from "./database";
import { Response } from "express";

export abstract class BaseDAO {
    protected _id: ObjectId | undefined | null
    public get id(): ObjectId | null {
        return this._id ? new ObjectId(this._id.toString()) : null
    }
    public res: Response;
    constructor(res: Response, id?: ObjectId) {
        this._id = id;
        this.res = res
    }
    public PropertiesWithGetter(): Object {
        return Object.fromEntries(
            Object.entries(
                Object.getOwnPropertyDescriptors(
                    Reflect.getPrototypeOf(this)
                )
            )
                .filter(e => typeof e[1].get === 'function' && e[0] !== '__proto__')
                .map(e => {
                    var self: any = this
                    return [e[0], self[e[0]]]
                })
        );
    }
    public Serialize(pushErrorWhenUndefined: boolean): Object {
        var obj = this.PropertiesWithGetter()
        if (pushErrorWhenUndefined) {
            var undefinedEntries = Object.entries(obj).filter(e => e[1] === undefined)
            if (undefinedEntries.length > 0)
                this.res.locals.RequestErrorList.push(new RequestError(`Undefined entries: ${undefinedEntries.map(e => e[0]).join(", ")}`))
        }
        return obj
    }
    public Hydrated(): Object {
        var obj = this.PropertiesWithGetter()
        obj = { _id: this._id, ...obj }
        return obj
    }
}

