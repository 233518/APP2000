const express = require('express');
const Bruker = require('../database/brukerSchema');
const router = express.Router();
const bcrypt = require("bcrypt");
const _ = require('lodash');
const hjelpeMetoder = require('../handling/hjelpeMetoder');
var mailer = require('../handling/mailer');
const jwt = require('jsonwebtoken');
const asyncExpress = require('../handling/expressUtils');

router.get("/logout", asyncExpress (async (req, res, next) => {
    req.session.destroy(err => {
        res.clearCookie('connect.sid')
        res.redirect('/')
      })
}));

router.get("/resetpassword/:token", asyncExpress (async (req, res, next) => {
    let token = req.params.token
    res.render("auth/resetpassword", {
        token: token
    });
  }));

//Først kan vi sette opp signup
router.post("/signup", asyncExpress (async (req, res, next) => { //Grunnen til at vi bruker async er fordi det å hashe tar tid, vi vil ikke at koden bare skal fortsette
    const pugBody = req.body; //Skaffer body fra form
    //Sjekker at mail tilfredsstiller krav
    if(!(hjelpeMetoder.data.validateEmail(pugBody.email))){
        res.redirect('/?error=Email is not properly formatted&errorType=signup');
        return;
    }
    if(!(Bruker.findOne({email: pugBody.email}))) {
        res.redirect('/?error=Email is already taken&errorType=signup');
        return;
    }
    //Sjekker at passord tilfredstiller krav
    if(!(hjelpeMetoder.data.validatePassword(pugBody.password))){
        res.redirect('/?error=Password is not properly formatted&errorType=signup');
        return;
    }
    //Vi gjør en sjekk at alle feltene er fylt inn
    if(!(pugBody.email && pugBody.password && pugBody.passwordRepeat)) {
        res.redirect('/?error=Data is not properly formatted&errorType=signup');
        return;
    }
    //Vi gjør en sjekk at passord 1 er lik passord 2 (Repeat password)
    if(!(pugBody.password == pugBody.passwordRepeat)) {
        res.redirect('/?error=Passwords do not match&errorType=signup');
        return;
    }

    //Nå må vi lage et nytt bruker objekt
    const bruker = new Bruker(pugBody);
    
    //Nå må vi lage ny salt for å hashe passord
    const salt = await bcrypt.genSalt(10); //Her kommer await (Se async) inn (Nå venter vi til bcrypt er ferdig)

    //Nå setter vi passord til det hasha passordet
    bruker.password = await bcrypt.hash(bruker.password, salt);
    bruker.save().then((dokument) => {
        //res.status(201).send(dokument); debug only
        mailer({
            from: process.env.EMAIL,
            to: process.env.EMAIL, //bruker.email skal brukes her når det skal testes mot "ekte" bruker,
            subject: 'Welcome to Filmatory!',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean dictum vulputate luctus.'
        });
    })
    res.redirect('/');
}));

//Her tar vi oss av login
router.post("/login", asyncExpress (async (req, res, next) => { //Grunnen til at vi bruker async er fordi det å hashe tar tid, vi vil ikke at koden bare skal fortsette
    const pugBody = req.body; //Skaffer body fra form
    const bruker = await Bruker.findOne({email: pugBody.email}); //Finner brukeren fra databasen
    //Nå skal vi sjekke om passordet stemmer
    if(bruker) {
        const sjekkPassword = await bcrypt.compare(pugBody.password, bruker.password); //Bruker bcrypt for å sammenligne, true/false return
        if (sjekkPassword) {
            req.session.userId = bruker._id; //Setter session
            res.redirect('/');
            return;
        } else {
            res.redirect('/?error=Invalid Password&errorType=login');
            return; //Returnerer 400 dersom passordet var feil
        }
    } else {
        res.redirect('/?error=User does not exist&errorType=login');
        return;
    }
}));

router.post('/forgottenPassword',asyncExpress (async (req, res, next) => {
    const pugBody = req.body;
    Bruker.findOne({email: pugBody.emailForgottenPassword}, (err, bruker) => {
        if(!bruker || err) {
            res.redirect('/?error=User with this email does not exist&errorType=forgottenPassword');
            return;
        }
        const token = jwt.sign({_id: bruker._id}, process.env.RESET_PASSWORD_KEY, {expiresIn:'60m'});
        return bruker.updateOne({resetLink: token}, function(err, success) {
            if(err) {
                res.redirect('/?error=Reset password link error&errorType=forgottenPassword');
                return;
            } else {
                let link = `http://${process.env.CLIENT_URL}/auth/resetpassword/${token}`
                mailer({
                    from: process.env.EMAIL,
                    to: process.env.EMAIL,
                    subject: 'Password Reset Link',
                    html: `
                    <h2>Please click on the link below reset your password</h2>
                    <p>${link}</p>
                    `
                });
            }
        })
    })
}));

router.post('/resetPassword/:token', asyncExpress (async (req, res, next) => { //Grunnen til at vi bruker async er fordi det å hashe tar tid, vi vil ikke at koden bare skal fortsette
    const resetLink = req.params.token;
    const pugBody = req.body;
    if(resetLink){
        jwt.verify(resetLink, process.env.RESET_PASSWORD_KEY, function(err, decodedData) {
            if(err) {
                return res.status(401).json({error: 'Incorrect token or it has expired'});
            }
            Bruker.findOne({resetLink}, async (err, bruker) => {
                if(err || !bruker) {
                    return res.status(400).json({error: 'User with this token does not exist.'});
                }
                if(!(pugBody.newPassword == pugBody.newPasswordRepeat)) {
                    return res.status(400).send({error: "Passwords do not match"}); //Denne må endres, viser bare en error melding dersom de ikke matcher for nå
                }
                //Nå må vi lage ny salt for å hashe passord
                const salt = await bcrypt.genSalt(10); //Her kommer await (Se async) inn (Nå venter vi til bcrypt er ferdig)

                //Nå setter vi passord til det hasha passordet
                bruker.password = await bcrypt.hash(pugBody.newPassword, salt);
                bruker.resetLink = '';

                bruker.save((err, result) => {
                    if(err) {
                        return res.status(400).json({error: 'Reset password error'});
                    } else {
                        return res.status(200).json({message: 'Your password has been changed'});
                    }
                })
            })
        })
    }else {
        return res.status(401).json({error: 'Authentication error!!!'});
    }
}));

module.exports = router;