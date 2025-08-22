const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true
  }
});

// Add the passport-local-mongoose plugin, which handles hashing passwords and adding username and salt
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
