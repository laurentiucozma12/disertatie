const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", requireAuth, (req, res) => {
  res.render("humanResources", { user: req.session.user });
});

module.exports = router;
