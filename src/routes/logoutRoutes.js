const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  req.session.destroy(() => res.redirect("/login?message=Logged+out!"));
});

module.exports = router;
