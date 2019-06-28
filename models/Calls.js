const mongoose = require('mongoose');

const { Schema } = mongoose;

const CallsSchema = new Schema({
  index: String,
  extId: String,
  datetime: Date,
  caller: String,
  callerCompany: String,
  summary: String,
  type: String,
  queue: String,
  phoneNo: String,
  eventAddress: String,
  eventAddressGeolocation: Object,
  promisedDateTime: Date,
  responsible: String,
  contact: String,
  contactAddress: String,
  contactAddressGeolocation: Object,
  contactPhoneNo: String,
  status: String,
  primaryTenant: String,
  activeTenant:  String
});

mongoose.model('Calls', CallsSchema);
