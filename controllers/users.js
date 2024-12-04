const User = require("../models/user");

module.exports = {
    renderSignupForm: (req, res) => {
        res.render("users/signup.ejs");
    },

    signup: async (req, res, next) => {
        try {
            let { username, email, password } = req.body;
            const newUser = new User({ username, email });
            const registeredUser = await User.register(newUser, password);
            console.log(registeredUser);
            
            req.login(registeredUser, err => {
                if(err) {
                    return next(err);
                }
                req.flash("success", "Welcome to the Wanderlust!");
                res.redirect("/listings");
            });
        } catch(e) {
            req.flash("error", e.message);
            res.redirect("/signup");
        }
    },

    renderLoginForm: (req, res) => {
        res.render("users/login.ejs");
    },

    login: async (req, res) => {
        req.flash("success", "Welcome back to Wanderlust!");
        let redirectUrl = res.locals.redirectUrl || "/listings";
        res.redirect(redirectUrl);
    },

    logout: (req, res, next) => {
        req.logout((err) => {
            if(err) {
                return next(err);
            }
            req.flash("success", "You are logged out!");
            res.redirect("/listings");
        });
    }
};