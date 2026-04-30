import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';

dotenv.config();

export const googleAuthEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CALLBACK_URL
);

if (googleAuthEnabled) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // User lookup and creation will be handled in auth service
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('Google account has no email address'));
          }
          return done(null, {
            googleId: profile.id,
            email,
            fullName: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value,
          } as unknown as Express.User);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

export default passport;
