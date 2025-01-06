const express = require("express");
const app = express();
const path = require("path");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const ExpressError = require("./utils/ExpressError");
const listingsRoutes = require("./routes/listings"); // Ensure correct path
const userRoutes = require("./routes/users"); // If you have users route
const reviewRoutes = require("./routes/reviews"); // If you have reviews route

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/yourDatabaseName", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

// Middleware
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "thisshouldbeabettersecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);
app.use(flash());

// Flash middleware
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// Routes
app.use("/listings", listingsRoutes); // Listings routes
app.use("/users", userRoutes); // Users routes
app.use("/listings/:id/reviews", reviewRoutes); // Reviews routes

// Error handling
app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Something went wrong!";
  res.status(statusCode).render("error", { err });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Serving on port ${port}`);
});
