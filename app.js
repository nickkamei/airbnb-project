const express = require("express");
const app = express();
const path = require("path");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");
const ExpressError = require("./utils/ExpressError");
const listingsRoutes = require("./routes/listings");
const mongoose = require("mongoose");
require("dotenv").config();

// Database connection
mongoose
    .connect(process.env.ATLASDB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Database connection error:", err));

// Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// Session and Flash
app.use(
    session({
        secret: process.env.SESSION_SECRET || "thisshouldbeabettersecret",
        resave: false,
        saveUninitialized: true,
        cookie: { httpOnly: true, secure: false },
    })
);
app.use(flash());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

// Routes
app.use("/listings", listingsRoutes);

// Catch-all 404 handler
app.all("*", (req, res, next) => {
    next(new ExpressError("Page not found", 404));
});

// Error handling middleware
app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("error", { err });
});

module.exports = app;
