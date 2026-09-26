import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "@/configs/env";
import { logger } from "@/server";

const clientId = env.GOOGLE_CLIENT_ID;
const clientSecret = env.GOOGLE_CLIENT_SECRET;
const redirectUri = env.GOOGLE_REDIRECT_URI;

passport.use(
    new GoogleStrategy(
        {
            clientID: clientId,
            clientSecret,
            callbackURL: redirectUri,
        },
        function (accessToken, _refreshToken, profile, cb) {
            logger.info(`Access token: ${accessToken}`);
            return cb(null, profile);
        },
    ),
);
