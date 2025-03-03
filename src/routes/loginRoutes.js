const express = require("express");
const bcrypt = require("bcrypt");
const userCollection = require("../config/db");

const router = express.Router();

router.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  res.render("login", { message: req.query.message });
});

router.post("/", async (req, res) => {
  const user = await userCollection.findOne({ email: req.body.email });

  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return res.redirect("/login?message=Invalid+email+or+password!");
  }

  req.session.user = {
    id: user._id,
    email: user.email,
    username: user.username,
  };
  res.redirect("/dashboard");
});

module.exports = router;
