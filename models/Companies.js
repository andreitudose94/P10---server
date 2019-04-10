const mongoose = require('mongoose');
const crypto = require('crypto');

const { Schema } = mongoose;

const CompaniesSchema = new Schema({
  name: String,
  hash: String,
  salt: String,
  address: String,
  email: String,
  primaryTenant: String,
  activeTenant:  String
});

CompaniesSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

CompaniesSchema.methods.validatePassword = function(password) {
  const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
  return this.hash === hash;
};

mongoose.model('Companies', CompaniesSchema);
