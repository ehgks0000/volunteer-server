import { Router } from "express";
import passport from "passport";
import Container from "typedi";
import { CompanyController, UserController } from "../../controllers";
import { asyncHandler } from "../../utils";

const authRouter = Router();

const userController = Container.get(UserController);
const companyController = Container.get(CompanyController);

authRouter.route("/local").post(passport.authenticate("local"), (_, res) => {
  return res.status(200).send("Logged in.");
});

authRouter
  .route("/local/signup/user")
  .post(asyncHandler(userController.createUserByLocal));

authRouter
  .route("/local/signup/company")
  .post(asyncHandler(companyController.createCompany));

authRouter
  .route("/google")
  .get(passport.authenticate("google", { scope: ["profile", "email"] }));

authRouter.route("/google/callback").get(
  passport.authenticate("google", {
    failureRedirect: `/login`,
    // failureRedirect: `${CLIENT_DOMAIN}/login`,
  }),
  (_, res) => {
    res.redirect("/");
    // res.redirect(CLIENT_DOMAIN);
  }
);

export { authRouter };
