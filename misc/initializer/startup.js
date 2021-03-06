const sharedsession = require('express-socket.io-session');
const languageConfig = require('../../lang/config');
const ValidationHandler = require('../../handling/ValidationHandler');
const tmdb = require('../../handling/tmdbHandler');
const bodyParser = require('body-parser');
const path = require("path");
const logger = require('../../logging/logger');
const socketRouter = require('../../socket/socketRouter');

/**
 * Skaffer start informasjon
 * @returns ValidationHandler
 * @author Sivert - 233518
 */
exports.makeInformation = async function() {
    const result = await tmdb.data.hentTmdbInformasjon();
    if(!result.status) return result;
    return new ValidationHandler(true, result.information);
}

/**
 * Kobler til databasen
 * @param {Object} mongoose Database objektet som skal kobles til 
 * @returns ValaidationHandler
 * @author Alle
 */
exports.connectToDatabase = function(mongoose) {
    return mongoose
    .connect(process.env.MONGO_DB_URL || "mongodb://localhost:27017/app", { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
    .then((_) => {
        logger.log({level: 'info', message: 'Successfully connected to database!'})
        return new ValidationHandler(true, 'Successfully connected to database!');
    })
    .catch((err) => {
        logger.log({level: 'error', message: `Cant connect to database! ${err}`})
        return new ValidationHandler(false, 'Cant connect to database!');
    });
}

/**
 * Konfigurerer applikasjonen første gang
 * @param {Object} app Express webserver applikasjonen
 * @param {Object} session Session som skal brukes
 * @param {Object} express Express applikasjonen
 * @returns ValidationHandler
 * @author Ørjan - 233530, Sivert - 233518
 */
exports.configureApp = function(app, session, express) {
    //Setter express til å bruke pug
    app.set("view engine", "pug");
    //Forteller express hvordan public path som skal brukes
    app.use(express.static(path.join(__dirname, "../../public")));
  
    //Forteller at app skal bruke i18n - Språk
    app.use(languageConfig.configure_language);
  
    //Forteller at app skal bruke sessionExpress middlewasre
    app.use(session);
  
    //Denne sier at vi skal bruke bodyParser som gjør om body til json
    app.use(bodyParser.json()); 
  
    //Samme som over bare application/xwww-form-urlencoded
    app.use(bodyParser.urlencoded({ extended: true })); 
  
    //Error handling
    app.use((err, req, res, next) => {
        res.send("Something wrong happen! Please try again later");
        logger.log({level: 'error',message: `Express threw an error! Error: ${err}`});
    });

    return new ValidationHandler(true, 'Express is successfully configured');
}

/**
 * Konfigurerer socket.io
 * @param {Object} io Socket som skal kobles opp 
 * @param {Object} session Session som skal kobles
 * @author Sivert - 233518
 */
exports.configureIo = function(io, session) {
    //Kobler sammen session med io
    io.use(sharedsession(session));
}

/**
 * Konfigurerer session
 * @param {Object} mongoose Databasen som skal brukes 
 * @param {Object} session Session som skal brukes
 * @param {Object} MongoStore MongoStore som skal brukes 
 * @returns Session objekt
 * @author Sivert - 233518
 */
exports.configureSession = function(mongoose, session, MongoStore) {
    return session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: new MongoStore({
            mongooseConnection: mongoose.connection,
            touchAfter: 12 * 3600
        }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 //Setter cookies til å slettes etter 1 day
        },
    });
}

/**
 * Starter routing og socket
 * @param {Object} app Express webserver applikasjonen
 * @param {Object} io Socket som skal brukes
 * @author Sivert - 233518
 */
exports.startRouting = function(app, io) {
    app.use(require('../../routing/index'));
    io.on('connection', (socket) => {
        //Logger at ny bruker logget på nettsiden
        logger.log({level: 'info',message: `New user just connected`});
        //Sender over til fil som fungerer som en router
        socketRouter(socket);
    });
}
