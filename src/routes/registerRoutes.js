const express = require("express");
const bcrypt = require("bcrypt");
const userCollection = require("../config/db");

const router = express.Router();

router.get("/", (req, res) => {
  console.log("GET /register route");

  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  res.render("register");
});

router.post("/", async (req, res) => {
  const { email, username, password } = req.body;
  const existingUser = await userCollection.findOne({ email });

  if (existingUser) {
    return res.redirect("/register?message=Email+already+exists!");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await userCollection.insertMany({
    email,
    username,
    password: hashedPassword,
  });

  res.redirect("/login?message=User+registered+successfully!");
});

module.exports = router;
