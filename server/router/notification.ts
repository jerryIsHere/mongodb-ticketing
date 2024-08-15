import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { ObjectId, WithId, Document, } from "mongodb";
import { v1 } from '../../mongoose-schema/schema'

// TODO: api & web front for admin to track send / failed email, and potentially retry sending failed one.