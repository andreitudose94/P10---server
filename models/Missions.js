const mongoose = require('mongoose');

const { Schema } = mongoose;

const MissionsSchema = new Schema({
  call_id: String,
  call_index: String,
  estimatedStartDateTime: Date,
  effectiveStartDateTime: Date,
  estimatedEndDateTime: Date,
  effectiveEndDateTime: Date,
  summary: String,
  contact: String,
  contactPhoneNo: String,
  contactAddress: String,
  responsible: String,
  responsibleGeolocation: Object,
  eventAddress: String,
  eventAddressGeolocation: Object,
  takenImages: Array,
  file: Object,
  signature: String,
  status: String,
  primaryTenant: String,
  activeTenant:  String,
  modifiedAt: Date,
  contractNumber: String,
  services: Array,
  renderedServices: Array,
  totalPrice: String,
});

mongoose.model('Missions', MissionsSchema);
