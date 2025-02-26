const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();

const port = 5000;

app.set("view engine", "ejs");

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
