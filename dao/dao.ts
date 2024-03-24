import { ObjectId } from "mongodb";
import { RequestError } from "./database";
import { Database } from "./database";


export abstract class BaseDAO {
    public static DirtyList: Set<BaseDAO> = new Set<BaseDAO>();
    protected _id: ObjectId | undefined | null
    public get id(): ObjectId | null {
        return this._id ? new ObjectId(this._id.toString()) : null
    }
    constructor(id?: ObjectId) {
        this._id = id;
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
    public Serialize(throwErrorWhenUndefined: boolean): Object {
        var obj = this.PropertiesWithGetter()
        if (throwErrorWhenUndefined) {
            var undefinedEntries = Object.entries(obj).filter(e => e[1] === undefined)
            if (undefinedEntries.length > 0)
                throw new RequestError(`Undefined entries: ${undefinedEntries.map(e => e[0]).join(", ")}`)
        }
        return obj
    }
    public static read(collection_name: string, _id: ObjectId) {
        return Database.mongodb.collection(collection_name).findOne({ _id: _id })
    }
}

