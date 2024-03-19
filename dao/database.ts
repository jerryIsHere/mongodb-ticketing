import { Db, MongoClient, ObjectId,  } from "mongodb";

export abstract class Database {
    public static uri: string = `mongodb+srv://${process.env.mongo_username}:${process.env.mongo_password}@atlascluster.gbqtcg3.mongodb.net/?retryWrites=true&w=majority`

    public static mongo: MongoClient = new MongoClient(Database.uri)

    public static mongodb: Db;

    public static DirtyDAO: Set<BaseDAO> = new Set<BaseDAO>();

    public static ReturnDAO: BaseDAO;
    public static CommitDAO() {
        this.DirtyDAO.forEach((dao) => {
            dao.update()
        })
    }
}

export abstract class BaseDAO {
    constructor(private collection_name: string, private _id?: ObjectId) {

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
    public update() {
        if (this._id) {
            Database.mongodb.collection(this.collection_name).updateOne({ _id: this._id }, this.PropertiesWithGetter())
        }
    }
    public create() {
        Database.mongodb.collection(this.collection_name).insertOne(this.PropertiesWithGetter())
    }
    public delete() {
        if (this._id) {
            Database.mongodb.collection(this.collection_name).deleteOne({ _id: this._id })
        }
    }
    public static read(collection_name: string, _id: ObjectId) {
        return Database.mongodb.collection(collection_name).findOne({ _id: _id })
    }
}

export class RequestError extends Error {
    constructor(m: string) {
        super(m);
    }

}