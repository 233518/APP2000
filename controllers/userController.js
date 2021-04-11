const hjelpeMetoder = require('../handling/hjelpeMetoder');
const favoriteMovie = require('../favourite/favouriteMovie');
const favoriteTv = require('../favourite/favouriteTv');
const uploadHandle = require('../handling/uploadHandler');
const Session = require("../database/sessionSchema");
const bcrypt = require("bcrypt");
const fs = require("fs");
const logger = require('../logging/logger');
const movieHandler = require('../handling/movieHandler');
const tvHandler = require('../handling/tvHandler');
const Bruker = require('../handling/userHandler');
const BrukerDB = require('../database/brukerSchema');
const watchedGetter = require('../watched/watchedGetter');

exports.user_get_dashboard = async function(req, res) {
    var session = await Session.findOne({_id: req.sessionID});
    var user = await Bruker.getUser({_id: req.session.userId});
    let favoriteMovies = (await favoriteMovie.getAllMovieFavourites(req.session.userId)).information;
    let favoriteTvs = (await favoriteTv.getAllTvFavourites(req.session.userId)).information;
    let watchedMovies = (await watchedGetter.getWatchedMovies(req.session.userId)).information.moviesWatched;
    let watchedTvs = (await watchedGetter.getWatchedTvs(req.session.userId)).information.tvsWatched;
    let allFavorites = [];
    let allWatched = [];
    let error = null;
    let errorType = null;

    for(const item of favoriteMovies){
        let result = await (await movieHandler.getMovieById(item));
        let tempObj = {
            id: result.information.id,
            pictureUrl: result.information.poster_path,
            title: result.information.original_title,
            releaseDate: await hjelpeMetoder.data.lagFinDatoFraDB(result.information.release_date, ', ')
        }
        allFavorites.push(tempObj);
    }
    
    for(const item of favoriteTvs){
        let result = await (await tvHandler.getShowById(item));
        let tempObj = {
            id: result.information.id,
            pictureUrl: result.information.poster_path,
            title: result.information.name,
            releaseDate: await hjelpeMetoder.data.lagFinDatoFraDB(result.information.first_air_date, ', ')
        }
        allFavorites.push(tempObj);
    }

    for(const item of watchedMovies){
        let result = await(await movieHandler.getMovieById(item));
        let tempObj = {
            id: result.information.id,
            pictureUrl: result.information.poster_path,
            title: result.information.title,
            releaseDate: await hjelpeMetoder.data.lagFinDatoFraDB(result.information.release_date, ', ')
        }
        allWatched.push(tempObj);
    }

    for(const item of watchedTvs){
        let result = await (await tvHandler.getShowById(item));
        let tempObj = {
            id: result.information.id,
            pictureUrl: result.information.poster_path,
            title: result.information.name,
            releaseDate: await hjelpeMetoder.data.lagFinDatoFraDB(result.information.first_air_date, ', ')
        }
        allWatched.push(tempObj);
    }

    if(req.query.error) {
        error = req.query.error;
        errorType = req.query.errorType;
    }

    if(!session){
        res.redirect("/");
    }

    res.render("user/dashboard", {
        username: session ? true : false,
        user: user.information,
        admin: user.information.administrator,
        allFavorites: allFavorites,
        allWatched: allWatched,
        urlPath: res.locals.currentLang ? res.locals.currentLang : ``,
        lang: res.locals.lang,
        langCode: res.locals.langCode,
        error: JSON.stringify(error),
        errorType: JSON.stringify(errorType)
    });
}

exports.user_post_changepassword = async function(req, res) {
    const pugBody = req.body; //Skaffer body fra form
    BrukerDB.findOne({_id: req.session.userId}, async (err, bruker) => {
        if(err) {
            return res.status(400).json({message: 'Error'});
        }
        //Sjekker at passord tilfredstiller krav
        if(!(hjelpeMetoder.data.validatePassword(pugBody.dashboardNewPassword))){
            logger.log({level: 'debug', message: `Password is not properly formatted!`}); 
            res.redirect(`/${res.locals.currentLang}/user/dashboard?error=Password is not properly formatted&errorType=dashboardChangePassword`);
            return;
        }
        //Vi gjør en sjekk at alle feltene er fylt inn
        if(!(pugBody.dashboardNewPassword && pugBody.dashboardNewPasswordRepeat)) {
            logger.log({level: 'debug', message: `All form inputs are not filled!`}); 
            res.redirect(`/${res.locals.currentLang}/user/dashboard?error=Data is not properly formatted&errorType=dashboardChangePassword`);
            return;
        }
        //Vi gjør en sjekk at passord 1 er lik passord 2 (Repeat password)
        if(!(pugBody.dashboardNewPassword == pugBody.dashboardNewPasswordRepeat)) {
            logger.log({level: 'debug', message: `Passwords do not match each other!`}); 
            res.redirect(`/${res.locals.currentLang}/user/dashboard?error=Passwords do not match&errorType=dashboardChangePassword`);
            return;
        }
        //Nå må vi lage ny salt for å hashe passord
        const salt = await bcrypt.genSalt(10); //Her kommer await (Se async) inn (Nå venter vi til bcrypt er ferdig)

        //Nå setter vi passord til det hasha passordet
        bruker.password = await bcrypt.hash(pugBody.dashboardNewPassword, salt);
        bruker.save((err, result) => {
            if(err) {
                logger.log({level: 'error', message: `Could not change password! Error: ${err}`});
                res.redirect(`/${res.locals.currentLang}/user/dashboard?error=Could not save password to user&errorType=dashboardChangePassword`);
                return;
            } else {
                logger.log({level: 'debug', message: `Password has been changed!`});
                res.redirect(`/${res.locals.currentLang}/user/dashboard`);
                return;
            }
        })
    })
}

exports.user_post_changeusername = function(req, res) {
    const pugBody = req.body; //Skaffer body fra form
    BrukerDB.findOne({_id: req.session.userId}, async (err, bruker) => {
        if(err) {
            logger.log({level: 'error', message: `Error: ${err}`});
            res.redirect(`/${res.locals.currentLang}/user/dashboard?error=Something went wrong&errorType=dashboardChangeUsername`);
            return;
        }
        bruker.username = pugBody.username;
        bruker.save((err, result) => {
            if(err) {
                logger.log({level: 'error', message: `Could not change username! Error: ${err}`});
                res.redirect(`/${res.locals.currentLang}/user/dashboard?error=Could not change username&errorType=dashboardChangeUsername`);
                return;
            } else {
                logger.log({level: 'debug', message: `Username has been changed! Error: ${err}`});
                res.redirect(`/${res.locals.currentLang}/user/dashboard`);
                return;
            }
        })
    })
}

exports.user_post_changeavatar = function(req, res) {
    const dest = '/uploads/';
    const defaultDest = '/uploads/default.png';
    BrukerDB.findOne({_id: req.session.userId}, async (err, bruker) => {
        uploadHandle(req, res, function(err){
            if(req.file == undefined){
                logger.log({level: 'error', message: `Error: ${err}`});
                return res.redirect(`/${res.locals.currentLang}/user/dashboard?error=No file found&errorType=dashboardUploadAvatar`);
            }
            if(err){
                logger.log({level: 'error', message: `Error: ${err}`});
                return res.redirect(`/${res.locals.currentLang}/user/dashboard?error=Wrong file type&errorType=dashboardUploadAvatar`);
            }
            if(!req.file.filename){
                logger.log({level: 'error', message: `Could not get image! Error: ${err}`});
                return res.redirect(`/${res.locals.currentLang}/user/dashboard?error=Wrong file type&errorType=dashboardUploadAvatar`);
            } else {
                if(bruker.avatar != defaultDest){
                    fs.unlink('./public' + bruker.avatar, function (err){
                        if(err){
                            logger.log({level: 'error', message: `Could not find old image! Error: ${err}`});
                            return res.redirect(`/${res.locals.currentLang}/user/dashboard?error=Something went wrong&errorType=dashboardUploadAvatar`);
                        }
                    });
                }

                bruker.avatar = dest + req.file.filename;
                bruker.save((err, result) => {
                    if(err) {
                        logger.log({level: 'error', message: `Error in saving avatar to user! Error: ${err}`});
                        return res.redirect(`/${res.locals.currentLang}/user/dashboard?error=Cant save avatar to user&errorType=dashboardUploadAvatar`);
                    } else {
                        logger.log({level: 'debug', message: `Avatar has been changed!`});
                        return res.redirect(`/${res.locals.currentLang}/user/dashboard`);
                    }
                })
            }
        })
    })
}