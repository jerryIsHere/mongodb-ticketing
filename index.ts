import express, { Express, Request, Response, NextFunction, Send } from "express";
import session from 'express-session';
import { Database, RequestError } from "./server/database/database";
var MongoDBStore = require('connect-mongodb-session')(session);
import mongoose from 'mongoose';


const port = process.env.PORT || 3000;
const app: Express = express();
declare global {
  namespace Express {
    interface Locals {
      RequestErrorList: RequestError[]
      session: mongoose.ClientSession | undefined
    }
  }
}
// sql session
const options = {
  uri: Database.uri,
  databaseName: 'sessions',
  collection: 'sessions'
}
var sessionStore = new MongoDBStore(options);
sessionStore.on('error', (error: any) => {
  console.error(error);
});
app.set("trust proxy", true);
app.use(session({
  name: 'ticketing_sessionid',
  secret: 'sakdjfpaoisdfjpaosdijf',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: false, secure: false, sameSite: false, maxAge: 7 * 24 * 60 * 60 * 1000 },
}));


// angular front
app.use('/web', express.static('web/dist/ticketing/browser'))
app.use('/web/*', function (_, res: Response) {
  const options = {
    root: 'web/dist/ticketing/browser'
  };
  const fileName = 'index.html';
  res.sendFile(fileName, options);
});

app.use('*', async function (req, res: Response, next) {
  res.locals.RequestErrorList = new Array<RequestError>();
  next()
});
app.use(express.json())

import { User } from './server/router/user';
app.use('/user', User.RouterFactory());

import { Event } from './server/router/event';
app.use('/event', Event.RouterFactory());

import { Seat } from './server/router/seat';
app.use('/seat', Seat.RouterFactory());

import { Venue } from './server/router/venue';
app.use('/venue', Venue.RouterFactory());

import { Ticket } from './server/router/ticket';
import { OperationError, ReferentialError, ValidationError } from "./mongoose-schema/error";
import { MongoServerError } from "mongodb";
app.use('/ticket', Ticket.RouterFactory());


app.use('/*', function (_, res: Response) {
  res.redirect("/web/")
});

app.use(async (output: any, req: Request, res: Response, next: NextFunction) => {
  try {
    if (output instanceof Error || output instanceof RequestError || res.locals.RequestErrorList.length != 0) {
      if (res.locals.session?.inTransaction()) {
        console.log("abort");
        await res.locals.session.abortTransaction();
      }
      else {
      }
      if (output instanceof RequestError) {
        res.locals.RequestErrorList.push(output)
      }
      else if (output instanceof Error && (
        output.name == 'ValidationError' || 
        output instanceof ValidationError ||
        output instanceof ReferentialError ||
        output instanceof OperationError
      )) {
        res.locals.RequestErrorList.push(new RequestError(output.message))
      }
      else if (output instanceof MongoServerError){
        if(output.code == 11000) 
          res.locals.RequestErrorList.push(new RequestError("The creation fails as the request object already exists."))
      }
      else if(output instanceof Error){
        // unknow error is not presentable to end user
        // as it might contains confidential info / technical jargons
        console.log(output)
        res.locals.RequestErrorList.push(new RequestError("Unexpected error occured."))
      }
      res.status(400).json({ success: false, reasons: res.locals.RequestErrorList.map((err: any) => err.message) })
    }
    else {
      if (res.locals.session?.inTransaction()) {
        await res.locals.session.commitTransaction();
        res.json(output)
      }
      else {
        res.json(output)
      }
    }
    res.locals.session?.endSession();
  }
  catch (err) {
    console.log(err)
  }
  finally {
    next()
  }
})


Promise.all([Database.init()])
  .catch(e => {
    console.error(e)
  })
  .finally(() => {
    app.listen(port, () => { console.log("Server ready!"); });
  })

export default app;