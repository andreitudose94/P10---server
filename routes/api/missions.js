const env = require('../../env.json')
const mongoose = require('mongoose');
const moment = require('moment');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');
const Calls = mongoose.model('Calls');
const Missions = mongoose.model('Missions');

//GET mission which corresponds to sent call index (required, only authenticated users have access)
router.post('/view', auth.required, (req, res, next) => {
  const { payload: { id } } = req;
  const { body: { callIndex } } = req;

  console.log('daaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');

  let userPrimaryTenant = '', userActiveTenant = ''

  return Users.findById(id)
    .then((myUser) => {
      if(!myUser) {
        return res.status(422).json({
          message: 'Your account doesn\'t exist anymore!',
        });
      }

      userPrimaryTenant = myUser.primaryTenant
      userActiveTenant = myUser.activeTenant

      if(!callIndex) {
        return res.status(422).json({
          message: 'No call selected!',
        });
      }

      return Missions.find({ call_index: callIndex })

    })

    .then((missions) => res.json({ missions }))
});

module.exports = router;
