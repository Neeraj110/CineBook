import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { loginWithGoogle } from "../modules/auth/auth.service.js";
import { apiError } from "../utils/index.js";

export const configurePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ?? "http://localhost:5000/api/auth/callback/google",
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(apiError(400, "Google account does not include an email address"));
          }

          const result = await loginWithGoogle(profile.displayName, email);
          return done(null, { ...result.user, token: result.token } as unknown as Express.User & {
            token: string;
          });
        } catch (error) {
          return done(error as Error);
        }
      },
    ),
  );

  return passport;
};
