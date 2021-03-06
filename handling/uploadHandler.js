var multer  = require('multer');
var path = require('path');
const logger = require("../logging/logger");
const ValidationHandler = require('./ValidationHandler');

/**
 * Storage gir kontroll på lagring av filer
 * @author Ørjan Dybevik 233530
 */
var Storage = multer.diskStorage({
    destination: function(req, file, callback){
        callback(null, "./public/uploads/");
    },
    filename: function(req, file, callback){
        callback(null, file.fieldname + '_' + Date.now() + '_' + file.originalname);
    },
});

/**
 * Håndterer filer som blir lastet opp
 * @author Ørjan Dybevk 233530
 */
var upload = multer ({
    storage: Storage,
    fileFilter: function(req, file, cb){
        checkFileType(file, cb);
    },
    limits: { fileSize: 8*1024*1024 }
}).single('avatar');

/**
 * Sjekker at fil er jpeg, jpg eller png
 * @param {File} file 
 * @param {Object} cb 
 * @returns true/false
 * @author Ørjan Dybevik 233530
 */
function checkFileType(file, cb){
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if(mimetype && extname){
        return cb(null,true);
      } else {
        cb(new ValidationHandler(false,'Only Images'));
      }
}

module.exports = upload;