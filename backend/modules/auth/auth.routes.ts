import { Router } from "express";
import passport from "passport";
import { googleCallback, register, login, me, logout } from "./auth.controller.js";
import { authenticate } from "../../middlewares/authmiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, me);
router.post("/logout", logout);
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false }),
);
router.get(
  "/callback/google",
  passport.authenticate("google", { failureRedirect: "/api/auth/google/failure", session: false }),
  googleCallback,
);
router.get("/google/failure", (_req, res) => {
  res.redirect(
    `${process.env.FRONTEND_URL ?? "http://localhost:3000"}/login?error=google_auth_failed`,
  );
});

export default router;
