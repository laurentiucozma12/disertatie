function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login?message=Please+login+first!");
  }
  next();
}

module.exports = { requireAuth };
