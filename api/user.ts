import { NextFunction, Request, Response, Router } from "express";
import * as Express from "express-serve-static-core";
import { Database, RequestError } from "../dao/database";
import { UserDAO } from "../dao/user";
import EmailService from "../services/email";
import { generateResetToken } from "../utils/token";
declare module "express-session" {
  interface SessionData {
    user: UserDAO | null;
  }
}
export namespace User {
  export function RouterFactory(): Express.Router {
    var user = Router();
    const emailService = new EmailService();

    user.post(
      "/forget-password",
      async (req: Request, res: Response, next): Promise<any> => {
        if (!req.body.type) res.status(400).send("Missing type.");
        if (["email", "username"].includes(req.body.type)) res.status(400).send("Invalid type.");
        if (!req.body.email && !req.body.username) res.status(400).send("Email Address / Username are Required.");
        
        // Generate a password reset token and save it in the user in the database
        const validUser = 
            req.body.type === "email" ? 
            await UserDAO.findByEmail(req.body.email): 
            await UserDAO.fetchByUsernameAndDeserialize(req.body.username);
        if (!validUser) return next(new RequestError("User not found."));
        const resetToken = await generateResetToken();
        validUser.resetToken = resetToken;
        await validUser.update(validUser);
        // Send the password reset email containing the reset token
        emailService.resetPasswordEmail(validUser.email!, resetToken);
        res.json({ success: true, message: "Password reset email sent." });
      }
    );

    user.patch("/reset-password/:resetToken", async (req: Request, res: Response, next): Promise<any> => {
        const resetToken = req.params.resetToken;
        const newPassword = req.body.newPassword;
      
        if (resetToken && newPassword) {
          const validUser = await UserDAO.findByResetToken(resetToken);
          if (!validUser) return next(new RequestError("Invalid or expired reset token."));
            // Reset the user's password and clear the reset token
            await validUser.setPassword(newPassword);
            validUser.resetToken = null;
            await validUser.update(validUser);
        
            res.status(200).json({ success: true, message: "Password reset successful." });
        } else {
          next(new RequestError("Reset token and new password are required."));
        }
      });

    user.patch("/:userId", async (req: Request, res: Response, next) => {});

    user.put("/:userId", async (req: Request, res: Response, next) => {});

    user.post("/verify/:verificationToken", async(req: Request, res: Response, next: NextFunction) => {
      if (!req.params.verificationToken) next(new RequestError("Verification token is required."));

      const user = await UserDAO.findByVerificationToken(req.params.verificationToken);
      if (!user) return next(new RequestError("User not found."));
      user.verified = true;
      user.verificationToken = null;
      await user.update(user);

      res.json({ success: true, message: "Email verification successful." });
    })

    user.post("/", async (req: Request, res: Response, next): Promise<any> => {
      if (req.query.login != undefined) {
        if (req.body.password) {
          console.log("test");
          UserDAO.login(req.body.username, req.body.password)
            .then((user) => {
              req.session["user"] = user.withoutCredential();
              res.cookie(
                "user",
                JSON.stringify({
                  ...user.withoutCredential().Hydrated(),
                  hasAdminRight: user.hasAdminRight(),
                })
              );
              res.json({
                success: true,
                message: user.withoutCredential().Hydrated(),
              });
            })
            .catch((error) => next(error));
        } else {
          next(new RequestError("A login must be done with a password."));
        }
      } else if (req.query.logout != undefined) {
        req.session["user"] = null;
        res.clearCookie("user");
        res.json({ success: true });
      } else if (req.query.register != undefined) {
        if (
          req.body.username &&
          req.body.fullname &&
          req.body.email &&
          req.body.password
        ) {
          var dao = new UserDAO({
            username: req.body.username,
            fullname: req.body.fullname,
            email: req.body.email,
            singingPart: req.body.singingPart,
            verified: false,
          });

          dao
            .setPassword(req.body.password)
            .then((dao) => dao.create())
            .then(async(dao) => {
              await emailService.emailVerification(req.body.email, await generateResetToken());
              if (dao.id) {
                req.session["user"] = dao.withoutCredential();
                res.cookie(
                  "user",
                  JSON.stringify(dao.withoutCredential().Hydrated())
                );
                res.json({
                  success: true,
                  user: dao.withoutCredential().Hydrated(),
                });
              }
            })
            .catch((error) => next(error));
        }
      }
    });
    return user;
  }
}
