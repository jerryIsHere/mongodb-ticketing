import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { Database, RequestError } from "../dao/database";
import { UserDAO } from "../dao/user";
declare module "express-session" {
    interface SessionData {
        user: UserDAO | null;
    }
}
export namespace User {
    const saltRounds = 10;
    export function RouterFactory(): Express.Router {
        var user = Router()

        user.patch("/:userId", async (req: Request, res: Response, next) => {

        })


        user.put("/:userId", async (req: Request, res: Response, next) => {

        })
        user.post("/", async (req: Request, res: Response, next): Promise<any> => {
            try {
                if (req.query.login != undefined) {
                    if (req.body.password) {
                        console.log("test")
                        UserDAO.login(req.body.username, req.body.password).then(user => {
                            req.session['user'] = user.withoutCredential()
                            res.cookie("user", JSON.stringify({ ...user.withoutCredential().Serialize(false), hasAdminRight: user.hasAdminRight() }))
                            res.json({ success: true, message: user.withoutCredential().Serialize(false) })
                        })
                    }
                    else {
                        next(new RequestError("A login must be done with a password."))
                    }
                }
                else if (req.query.logout != undefined) {
                    req.session['user'] = null;
                    res.clearCookie("user");
                    res.json({ success: true })
                }
                else if (req.query.register != undefined) {

                    if (req.body.username && req.body.fullname && req.body.email && req.body.password) {
                        var dao = new UserDAO({
                            username: req.body.username,
                            fullname: req.body.fullname,
                            email: req.body.email,
                            singingPart: req.body.singingPart
                        })
                        dao.setPassword(req.body.password).then(() => {
                            dao.create().then((dao) => {
                                if (dao.id) {
                                    req.session['user'] = dao.withoutCredential()
                                    res.cookie("user", JSON.stringify(dao.withoutCredential().Serialize(false)))
                                    res.json({ success: true, user: dao.withoutCredential().Serialize(false) })
                                }
                            })
                        })

                    }
                }
            }
            catch (error) {
                next(error)
            }
        })
        return user
    };
}


