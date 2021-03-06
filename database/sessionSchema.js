const mongoose = require('mongoose');

//Schema til session
const sessionSchema = new mongoose.Schema({
  _id: {
    type: String,
  },
  expires: {
    type: Date,
  },
  lastModified: {
    type: Date,
  },
  session: {
      type: Object,
  },
});

module.exports = mongoose.model('session', sessionSchema); //ES6 Module