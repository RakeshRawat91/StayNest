const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');
const flash = require('connect-flash');
const Listing = require("./models/listing.js");
const User = require('./models/user.js'); // User model for authentication

const app = express();
const MONGO_URL = "mongodb://127.0.0.1:27017/StayNest";

// Connect to MongoDB
async function main() {
  await mongoose.connect(MONGO_URL);
  console.log("Connected to DB");
}
main().catch(err => console.log(err));

// Middleware setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

// Session and flash setup
app.use(session({
  secret: 'yourSecretKey',  // Replace with a secure key
  resave: false,
  saveUninitialized: false
}));
app.use(flash());

// Passport configuration for user authentication
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash message middleware
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Authentication middleware to ensure login
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Routes

// Home route
app.get("/", (req, res) => {
  res.render("listings/home.ejs");
});

// Sign-up routes
app.get('/register', (req, res) => {
  res.render('listings/register.ejs'); // Render registration form
});

app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ username, email });
    await User.register(user, password);  // Save user with hashed password
    req.flash('success', 'Successfully Registered!');
    res.redirect('/listings');
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/register');
  }
});

// Login and Logout routes
app.get('/login', (req, res) => {
  res.render('listings/login.ejs'); // Render login form
});

app.post('/login', passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: true
}), (req, res) => {
  req.flash('success', 'Welcome back!');
  res.redirect('/listings');
});

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash('success', 'Logged out successfully');
    res.redirect('/');
  });
});

// Listings routes
app.get("/listings", async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
});

app.get("/listings/new", isLoggedIn, (req, res) => {
  res.render("listings/new.ejs");
});

app.post("/listings", isLoggedIn, async (req, res) => {
  const newListing = new Listing(req.body.listing);
  await newListing.save();
  res.redirect("/listings");
});

app.get("/listings/:id", async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/show.ejs", { listing });
});

app.get("/listings/:id/edit", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
});

app.put("/listings/:id", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  res.redirect(`/listings/${id}`);
});

app.delete("/listings/:id", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  res.redirect("/listings");
});

// Message Route
app.post("/listings/:id/message", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  
  const listing = await Listing.findById(id);
  listing.messages.push({ text: message, sender: req.user._id });
  
  await listing.save();
  res.redirect(`/listings/${id}`);
});

// Renting and Unrenting Routes
app.post("/listings/:id/rent", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndUpdate(id, { rented: true });
  res.redirect("/listings");
});

app.post("/listings/:id/unrent", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndUpdate(id, { rented: false });
  res.redirect("/listings");
});

// Start server
app.listen(8080, () => {
  console.log("App is listening on port 8080");
});
