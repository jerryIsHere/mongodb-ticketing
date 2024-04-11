import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { ObjectId, WithId, Document, } from "mongodb";
import { EventDAO } from "../dao/event";
import { UserDAO } from "../dao/user";