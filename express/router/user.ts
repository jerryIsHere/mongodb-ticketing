import { NextFunction, Request, Response, Router } from "express";
import * as Express from "express-serve-static-core";
import { Database, RequestError } from "../dao/database";
import { UserDAO } from "../dao/user";
declare module "express-session" {
  interface SessionData {
    user?: { hasAdminRight: boolean, _id?: string } | null;
    test?: number
  }
}
export namespace User {
  export function RouterFactory(): Express.Router {
    var user = Router();

    var updateSession = (req: Request, res: Response, dao: UserDAO) => {
      var userObj = { _id: dao.id?.toString(), hasAdminRight: dao.hasAdminRight(), ...dao.Hydrated({ withCredentials: false }) }
      req.session.user = userObj
      req.session.save();
    }
    var clearSession = (req: Request, res: Response) => {
      req.session.user = null
    }
    user.post(
      "/forget-password",
      async (req: Request, res: Response, next): Promise<any> => {
        if (req.body.email === undefined && req.body.username === undefined) res.status(400).send("Email Address / Username are Required.");

        // Generate a password reset token and save it in the user in the database
        const validUser =
          req.body.email != undefined ?
            await UserDAO.findByEmail(res, req.body.email) :
            await UserDAO.fetchByUsernameAndDeserialize(res, req.body.username);
        if (!validUser) {
          next(new RequestError("User not found."));
          // Send the password reset email containing the reset token
        } else { await validUser.sendResetPasswordEmail(); }
        next({ success: true, message: "Password reset email sent." });
      }
    );

    user.patch("/reset-password/:resetToken", async (req: Request, res: Response, next): Promise<any> => {
      const resetToken = req.params.resetToken;
      const newPassword = req.body.newPassword;

      if (resetToken && newPassword) {
        const validUser = await UserDAO.findByResetToken(res, resetToken);
        if (!validUser) return next(new RequestError("Invalid or expired reset token."));
        // Reset the user's password and clear the reset token
        try {
          await validUser.setPassword(newPassword);
          validUser.resetToken = null;
          await validUser.update();
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

    user.patch("/:username", async (req: Request, res: Response, next) => {
      if (req.params.username && typeof req.params.username == "string") {
        if (req.query.profile != undefined) {
          UserDAO.fetchByUsernameAndDeserialize(res, req.params.username).then((dao) => {
            dao.email = req.body.email
            dao.fullname = req.body.fullname
            dao.singingPart = req.body.singingPart
            return dao.update()
          }).then((dao) => {
            updateSession(req, res, dao)
            next({ success: true, data: dao.Hydrated({ withCredentials: false }) })
          }).catch((error) => next(error))
        }
        else if (req.query.password != undefined) {
          UserDAO.fetchByUsernameAndDeserialize(res, req.params.username)
            .then((dao) => dao.setPassword(req.body.password)).then((dao) => dao.update())
            .then((dao) => {
              next({ success: true, data: dao.Hydrated({ withCredentials: false }) })
            }).catch((error) => next(error))
        }
      }
    });

    user.put("/:userId", async (req: Request, res: Response, next) => { });

    user.post("/verify/:verificationToken", async (req: Request, res: Response, next: NextFunction) => {
      if (!req.params.verificationToken) next(new RequestError("Verification token is required."));

      UserDAO.VerifyWithToken(res, req.params.verificationToken).then((dao) => {
        updateSession(req, res, dao)
        next({ success: true, data: dao.Hydrated({ withCredentials: false }) })
      }).catch((error) => next(error))
    })

    user.post("/", async (req: Request, res: Response, next): Promise<any> => {
      if (req.query.login != undefined) {
        if (req.body.password) {
          UserDAO.login(res, req.body.username, req.body.password).then(dao => {
            updateSession(req, res, dao)
            next({ success: true, data: dao.Hydrated({ withCredentials: false }) })
          }).catch((error) => next(error))
        } else {
          next(new RequestError("A login must be done with a password."));
        }
      } else if (req.query.logout != undefined) {
        clearSession(req, res)
        res.clearCookie("user");
        next({ success: true });
      } else if (req.query.register != undefined) {
        if (
          req.body.username &&
          req.body.fullname &&
          req.body.email &&
          req.body.password
        ) {
          var dao = new UserDAO(res, {
            username: req.body.username,
            fullname: req.body.fullname,
            email: req.body.email,
            singingPart: req.body.singingPart,
          });

          dao
            .setPassword(req.body.password)
            .then((dao) => dao.create())
            .then(async (dao) => {
              if (dao.id) {
                updateSession(req, res, dao)
                next({
                  success: true,
                  user: dao.Hydrated({ withCredentials: false }),
                });
              }
              return dao
            })
            .then(async (dao) => {
            })
            .catch((error) => next(error));
        }
      } else if (req.query.resendVerification != undefined) {
        if (req.session['user'] && (req.session['user'] as any)._id) {
          UserDAO.getById(res, (req.session['user'] as any)._id)
            .then(dao => dao.sendActivationEmail())
            .then(async (dao) => {
              next({
                success: true,
                user: dao.Hydrated({ withCredentials: false }),
              });
            })
            .catch((error) => next(error));
        }
      }
    });
    return user;
  }
}
