const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { Schema } = mongoose;

const ResponsiblesSchema = new Schema({
  name: String,
  email: String,
  hash: String,
  salt: String,
  phoneNo: String,
  responsibleId: String,
  status: String,
  currentMission: String,
  online: Boolean,
  geolocation: Object,
  lastSentInfoTime: Date,
  primaryTenant: String,
  activeTenant:  String
});

ResponsiblesSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

ResponsiblesSchema.methods.validatePassword = function(password) {
  const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
  return this.hash === hash;
};

ResponsiblesSchema.methods.generateJWT = function() {
  const today = new Date();
  const expirationDate = new Date(today);
  expirationDate.setDate(today.getDate() + 60);

  return jwt.sign({
    email: this.email,
    id: this._id,
    exp: parseInt(expirationDate.getTime() / 1000, 10)
  }, 'secret');
}

ResponsiblesSchema.methods.toAuthJSON = function() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    token: this.generateJWT(),
    primaryTenant: this.primaryTenant,
    activeTenant:  this.activeTenant
  };
};

mongoose.model('Responsibles', ResponsiblesSchema);
