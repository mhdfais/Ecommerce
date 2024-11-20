

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require('../Models/userModel');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // console.log(profile);

        let user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          return done(null, user); 
        }

        user = new User({
          name: profile.displayName,
          email: profile.emails[0].value,
          isVerified: true,
        });
        await user.save();
        return done(null, user); 
      } catch (error) {
        return done(error, null); 
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
