let router = require('express').Router();

router.use(function (req, res, next) {
  console.log("API Request Incoming");
  next(); // Request stops at middleware without next()
});

module.exports = router;