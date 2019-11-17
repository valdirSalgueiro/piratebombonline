const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  highScore: {
    type: Number,
    default: 0
  }  
});

const UserModel = mongoose.model('user', UserSchema);

module.exports = UserModel;
