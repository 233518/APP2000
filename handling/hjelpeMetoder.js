const logger = require('../logging/logger');
const fs = require('fs');
const ValidationHandler = require('./ValidationHandler');

 var methods = {
    /**
     * lagFinDato metoden gjør en dato lettere å lese
     * @param {Date} datoInn Dato som skal brukes
     * @param {String} stringTilSplitting String som kobler sammen dato
     * @returns String av dato
     * @author Govert - 233565
     */
    lagFinDato: function(datoInn, stringTilSplitting) {
        try {
            let splitDato = datoInn.split(stringTilSplitting);
            const dato = new Date(splitDato[0], splitDato[1]-1, splitDato[2])
            return dato.toLocaleString('default', { day: 'numeric', month: 'long', year: 'numeric' });
        } catch(err) {
            logger.log({level: 'error', message: `Could not format date from ${datoInn} with string ${stringTilSplitting}! Error: ${err}`}); 
        }
    },
    /**
     * Formaterer dato fra database fin
     * @param {Date} datoInn Dato som skal brukes
     * @returns String av dato
     * @author Ørjan - 233530 
     */
    lagFinDatoFraDB: function(datoInn) {
        try {
            var date = new Date(datoInn);
            return date.toLocaleString('default', { day: 'numeric', month: 'long', year: 'numeric' });
        } catch(err) {
            logger.log({level: 'error', message: `Could not format date from ${datoInn} with string ${stringTilSplitting}! Error: ${err}`}); 
        }
    },
    /**
     * Henter månedsnummer (plasser) fra dato
     * @param {Date} datoInn Dato som skal brukes
     * @param {String} stringTilSplitting String som kobler sammen datoen 
     * @returns String av månedsnummer 
     * @author Govert - 233565
     */
    lagfinMåned: function(datoInn, stringTilSplitting) {
        try {
            let splitDato = datoInn.split(stringTilSplitting);
            const dato = new Date(splitDato[0], splitDato[1]-1, splitDato[2]-1);
            const monthName = dato.getMonth();
            return monthName;
        } catch(err) {
            logger.log({level: 'error', message: `Could not format month from ${datoInn} with string ${stringTilSplitting}! Error: ${err}`});
            return 'undefined';
        }
    },
    /**
     * Henter dagsnummer sin plassering fra dato
     * @param {Date} datoInn Dato som skal brukes
     * @param {String} stringTilSplitting String som kobler sammen datoen
     * @returns Dagsnummer
     * @author Govert - 233565
     */
    lagfinDag: function(datoInn, stringTilSplitting) {
        try {
            let splitDato = datoInn.split(stringTilSplitting);
            const dato = new Date(splitDato[0], splitDato[1]-1, splitDato[2]-1)
            const dagnavn = dato.getDate()
            return dagnavn
        } catch(err) {
            logger.log({level: 'error', message: `Could not format day from ${datoInn} with string ${stringTilSplitting}! Error: ${err}`});
        }
    },
    /**
     * Henter årstall fra dato
     * @param {Date} datoInn Dato som skal brukes
     * @param {String} stringTilSplitting String som kobler sammen datoen
     * @returns String av årstall
     * @author Govert - 233565
     */
    lagfinÅrstall: function(datoInn, stringTilSplitting) {
        try {
            let splitDato = datoInn.split(stringTilSplitting);
            const dato = new Date(splitDato[0], splitDato[1]-1, splitDato[2]-1)
            const år = dato.getFullYear()
            return år
        } catch(err) {
            logger.log({level: 'error', message: `Could not format year from ${datoInn} with string ${stringTilSplitting}! Error: ${err}`});
        }
    },
    /**
     * Sjekker om email er valid
     * @param {String} email Eposten
     * @returns 
     * @author Ørjan - 233530
     */
    validateEmail: function(email){
        try{
            const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(String(email).toLowerCase());
        }catch(err) {
            logger.log({level: 'error', message: `Could not validate email ${email}! Error: ${err}`});
        }
    },
    /**
     * Sjekker om passord er valid
     * @param {String} password Passordet som skal sjekkes
     * @returns Boolean
     * @author Ørjan - 233530
     */
    validatePassword: function(password){
        try{
            const passw = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,20}$/;
            return passw.test(String(password));
        }catch(err) {
            logger.log({level: 'error', message: `Could not validate password! Error: ${err}`});
        }
    },
    /**
     * Leser fil
     * @param {String} path Pathen til fila
     * @returns ValidationHandler
     * @author Ørjan - 233530
     */
    lesFil: async function(path){
        return new Promise(function (resolve, reject) {
            fs.readFile(path, 'utf8', function (err, data) {
                if (err)
                    reject(new ValidationHandler(false, "Something went wrong"));
                else
                    resolve(new ValidationHandler(true, data));
            });
        });
    },
    /**
     * Formaterer tall til hele tusen/millioner/milliarder - Gov
     * @param {Number} int Nummer som skal formateres
     * @returns tall i hele tusen/millioner/milliarder
     * @author Govert - 233565
     */
    tallFormatering: function(int) {
        if (int < 999999)
            return `${Math.round(int / 1000)}K`
        if (int < 999999999)
            return `${Math.round(int / 1000000)}M`
        return `${Math.round(int / 1000000000)}B`
    },
    /**
     * Henter alle språkkodene tilgjenglig på siden
     * @returns Array av språkkoder
     * @author Ørjan - 233530
     */
    getAllLangCodes: async function(){
        let langCodes = [];
        let languageJson = await methods.lesFil("./lang/langList.json");
        for(const language of await JSON.parse(languageJson.information).availableLanguage) {
            langCodes.push(language.id);
        }
        return langCodes;
    },
    /**
     * Validerer innholdet av input om det tilfredstiller kravene
     * @param {Object} input Objektet som skal sjekkes
     * @returns ValidationHandler
     * @author Ørjan - 233530
     */
    validateNewLang: function(input, req){
        const re = /[A-Za-z]/;
        if(input.admindashlangcode.length !== 2){
            return new ValidationHandler(false, req.__('ERROR_LANGUAGE_CHARACTER_LIMIT'));
        }
        if(!re.test(input.admindashlangcode)){
            return new ValidationHandler(false, req.__('ERROR_LANGCODE_LETTERS'));
        }
        if(!re.test(input.admindashlangname)){
            return new ValidationHandler(false, req.__('ERROR_LANGUAGE_LETTERS'));
        }
        var langObj = {
            "name": input.admindashlangname.toLowerCase(),
            "id": input.admindashlangcode.toLowerCase(),
            "originalname": input.admindashlangoriginalname.charAt(0).toUpperCase() + input.admindashlangoriginalname.slice(1)
        }
        return new ValidationHandler(true, langObj);
    },
    /**
     * Sjekker at språket som administrator prøver å slette er skrevet korrekt og finnes i systemet
     * @param {String} input Input som skal sjekkes
     * @returns ValidationHandler
     * @author Ørjan - 233530
     */
    validateDeleteLang: async function(input, req){
        let languageJson = await methods.lesFil("./lang/langList.json");
        let langs = await JSON.parse(languageJson.information);
        let newLangList = [];
        let langToDelete;
        for(let i = 0; i < langs.availableLanguage.length; i++){
            if(langs.availableLanguage[i].name === input){
                langToDelete = langs.availableLanguage[i];
                langs.availableLanguage.splice(i, i);
                newLangList = JSON.stringify(langs);
                fs.writeFile('./lang/langList.json', newLangList, 'utf8', (err) => {
                    if(err){
                        return new ValidationHandler(false, req.__('ERROR_DELETE_LANGUAGE'));
                    }
                    logger.log({level: 'info', message: 'Language edits completed'});
                });
                return new ValidationHandler(true, langToDelete);
            }
        }
        return new ValidationHandler(false, req.__('ERROR_DELETE_LANGUAGE_NO_MATCH'));
    },
    /**
     * Randomizer et array
     * @param {String} array  Array som skal bli randomiza
     * @returns Et array som er shuffla
     * @author Internett
     * https://www.w3docs.com/snippets/javascript/how-to-randomize-shuffle-a-javascript-array.html
     * Hentet dato: 23/04/2021
     */
    shuffleArray: function(array) { 
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },
    /**
     * Lager en maks tekst lengde
     * @param {String} data Tekst som skal bli forkortet
     * @param {Number} max Maks lengde på tekst i antall chars
     * @returns String
     * @author Ørjan - 233530, Sigve - 233511
     */
    maxText: function(data, max){
        if(data.length > max){
            for(let i = max; i < max+20; i++){
                if(data.charAt(i) == ' '){
                    return data.slice(0,i-1) + '...';
                }
            }
        }
        return data;
    }
 };
 
 exports.data = methods;