import { NextFunction, Request, Response, Router } from "express";
import * as Express from "express-serve-static-core";
import { Database, RequestError } from "../database/database";
import { v1 } from '../../mongoose-schema/schema'
import { IDisclosableUser, userModel } from "../../mongoose-schema/v1/user";
import { SessionData } from "express-session";
import { names } from "../../mongoose-schema/schema-names";
declare module "express-session" {
  interface SessionData {
    user?: IDisclosableUser | null;
    test?: number
  }
}
export namespace User {
  export function RouterFactory(): Express.Router {
    var user = Router();
    var canManipulateUser = (session: SessionData) => {
      if (session && session.user)
        return session.user.hasAdminRight || session.user.isCustomerSupport
      return false
    }
    user.use((req: Request, res: Response, next) => {
      if (req.method == 'POST' && req.query.register != undefined && req.session.user?.hasAdminRight != true) {
        res.status(401).json({ success: false, reason: "Unauthorized access" })
      }
      if (req.method == 'PATCH' && (req.session.user?.username != req.query.username && req.session.user?.hasAdminRight != true)) {
        res.status(401).json({ success: false, reason: "Unauthorized access" })
      }
      else { next() }
    })

    var updateSession = (req: Request, res: Response, user: IDisclosableUser) => {
      req.session.user = user
      req.session.save();
    }
    var clearSession = (req: Request, res: Response) => {
      req.session.user = null
    }
    user.get("/", async (req: Request, res: Response, next) => {
      if (req.query.list != undefined) {
        if (req.query.lastPurchaseTicket != undefined) {
          userModel.aggregate([{
            $lookup: {
              from: "tickets",
              localField: "_id",
              foreignField: "purchaseInfo.purchaserId",
              as: "lastPurchaseTicket"
            }
          }, {
            $set: {
              lastPurchaseTicket: {
                $first: {
                  $sortArray: {
                    input: "$lastPurchaseTicket",
                    sortBy: {
                      "purchaseInfo.purchaseDate":
                        -1
                    }
                  }
                }
              }
            }
          }]).
            then(async doc =>
              next({
                success: true,
                data: doc
              })).
            catch(err => next(err))
        }
        else {
          userModel.find().then(docs => docs.map(doc => doc.disclose())).
            then(doc => next({ success: true, data: doc })).
            catch(err => next(err))
        }
      }
    })
    user.post(
      "/forget-password",
      async (req: Request, res: Response, next): Promise<any> => {
        if (req.body.email === undefined && req.body.username === undefined) res.status(400).send("Email Address / Username are Required.");
        try {
          // Generate a password reset token and save it in the user in the database
          const validUser =
            req.body.email != undefined ?
              await userModel.findOne({ email: req.body.email }).exec() :
              await userModel.findOne({ username: req.body.username.toLowerCase() }).exec();
          if (!validUser) {
            next(new RequestError("User not found."));
            // Send the password reset email containing the reset token
          } else {
            await validUser.sendResetPasswordEmail();
            next({ success: true, message: "Password reset email sent." });
          }
        }
        catch (err) {
          next(err)
        }
      }
    );

    user.patch("/reset-password/:resetToken", async (req: Request, res: Response, next): Promise<any> => {
      const resetToken = req.params.resetToken;
      const newPassword = req.body.newPassword;

      if (resetToken && newPassword) {
        if (process.env.ALLOW_USER_REGISTRATION?.toLocaleLowerCase() != "true" && !canManipulateUser(req.session))
          return next(new RequestError("User password could only be changed by admin."))
        try {
          const validUser = await userModel.findOne({ resetToken: resetToken }).exec();
          if (!validUser) return next(new RequestError("Invalid or expired reset token."));
          // Reset the user's password and clear the reset token
          await validUser.setSaltedPassword(newPassword);
          validUser.resetToken = undefined;
          await validUser.save();
        }
        catch (err) {
          next(err)
        }
        res.status(200).json({ success: true, message: "Password reset successful." });
      } else {
        next(new RequestError("Reset token and new password are required."));
      }
    });

    user.use((req: Request, res: Response, next) => {
      if (false) {
      }
      else { next() }
    })
    let changeableField = ["username", "fullname", "email", "singingPart"]
    user.patch("/:username", async (req: Request, res: Response, next) => {
      if (req.params.username && typeof req.params.username == "string") {
        if (req.query.profile != undefined) {
          userModel.findOne({ username: req.body.username.toLowerCase() }).
            then(user => {
              if (user) {
                let profile =
                  Object.fromEntries(changeableField.map(key => [key, req.body[key]]))
                Object.keys(profile).forEach(key => {
                  if (key in user) (user as any)[key] = profile[key]
                })
                return user.save()
              }
              throw new RequestError(`User with user name ${req.params.username} not found`)
            }).then((doc) => {
              if (doc) {
                updateSession(req, res, doc?.disclose())
                next({ success: true, data: req.session.user })
              }
            }).
            catch(err => next(err))
        }
        else if (req.body.password != undefined) {
          if (process.env.ALLOW_USER_REGISTRATION?.toLocaleLowerCase() != "true" && !canManipulateUser(req.session))
            return next(new RequestError("User password could only be changed by admin."))
          userModel.findOne({ username: req.params.username.toLowerCase() },
            req.body
          ).
            then(async doc => {
              await doc?.setSaltedPassword(req.body.password)
              return doc
            }).
            then((doc) => {
              if (doc) {
                if (req.session.user?.username == req.params.username) updateSession(req, res, doc?.disclose())
                next({ success: true, data: req.session.user })
              }
            }).
            catch(err => next(err))
        }
      }
    });

    user.put("/:userId", async (req: Request, res: Response, next) => { });

    user.post("/verify/:verificationToken", async (req: Request, res: Response, next: NextFunction) => {
      if (!req.params.verificationToken) next(new RequestError("Verification token is required."));
      userModel.verify(req.params.verificationToken).
        then(user => {
          updateSession(req, res, user.disclose());
          next({ success: true, data: req.session.user })
        }).
        catch(err => next(err))
    })

    user.post("/", async (req: Request, res: Response, next): Promise<any> => {
      if (req.query.login != undefined) {
        if (req.body.password) {
          userModel.login(req.body.username, req.body.password).then(user => {
            updateSession(req, res, user.disclose())
            next({ success: true, data: req.session.user })
          }).catch((error) => next(error))
        } else {
          next(new RequestError("A login must be done with a password."));
        }
      } else if (req.query.logout != undefined) {
        clearSession(req, res)
        res.clearCookie("user");
        next({ success: true });
      } else if (req.query.register != undefined) {
        if (process.env.ALLOW_USER_REGISTRATION?.toLocaleLowerCase() != "true" && !canManipulateUser(req.session))
          return next(new RequestError("New user registration is not avaliable."))
        if (
          req.body.username &&
          req.body.fullname &&
          req.body.email &&
          req.body.password
        ) {
          var user = new userModel({
            username: req.body.username,
            fullname: req.body.fullname,
            email: req.body.email,
            singingPart: req.body.singingPart,
          });

          await user.setSaltedPassword(req.body.password).
            then(user => user.save()).
            then(user =>
              next({
                success: true,
                user: user.disclose(),
              })).
            catch(err => next(err))
        }
      }
      // else if (req.query.resendVerification != undefined) {
      //   if (req.session['user'] && (req.session['user'] as any)._id) {
      //     let userId = (req.session['user'] as any)._id
      //     userModel.findById(userId)
      //     // TODO
      //   }
      // }
    });
    return user;
  }
}
