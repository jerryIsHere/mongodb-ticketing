import { ClientSession, Db, MongoClient, } from "mongodb";

declare namespace process {
    namespace env {
        let mongo_username: string
        let mongo_password: string
        let PORT: string | null
    }
}
export abstract class Database {
    public static readonly db_name = "ticketing"

    public static readonly uri: string = `mongodb+srv://${process.env.mongo_username}:${process.env.mongo_password}@atlascluster.gbqtcg3.mongodb.net/?retryWrites=true&w=majority`

    public static mongo: MongoClient = new MongoClient(Database.uri)

    public static mongodb: Db;
    public static session: ClientSession;

    public static async init() {
        await this.mongo.connect();
        // Send a ping to confirm a successful connection
        await this.mongo.db("admin").command({ ping: 1 });

        this.session = this.mongo.startSession();

        this.mongodb = this.mongo.db(this.db_name)

    }

}


export class RequestError extends Error {
    constructor(m: string) {
        super(m);
    }

}