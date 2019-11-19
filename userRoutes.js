const express = require('express');
const router = express.Router();
const passport = require('passport');

router.get("/auth", passport.authenticate("facebook"));
router.get("/auth/facebook/callback", passport.authenticate("facebook", {
    successRedirect: "/success",
    failureRedirect: "/fail"
})
);
router.get("/fail", (req, res) => {
    res.send("Failed attempt");
});

router.get("/success", (req, res) => {
    res.sendFile(__dirname + '/public/game.html');
});
router.get("/anonym", (req, res) => {
    res.sendFile(__dirname + '/public/game.html');
});



module.exports = router;	
