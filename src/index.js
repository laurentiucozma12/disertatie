const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();

const port = 5000;

// use EJS as the view engine
app.set("view engine", "ejs");

// static file
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

// app.get("/home", (req, res) => {
//   res.render("home");
// });

app.listen(port, () => {
  console.log(`Server running on Port: ${port}`);
});
