const env = require('../../env.json')
const mongoose = require('mongoose');
const moment = require('moment');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');
const Contracts = mongoose.model('Contracts');

//POST new services (auth required)
router.post('/new', auth.required, (req, res, next) => {
  const { payload: { id } } = req;
  const { body: { contract } } = req;

  let userPrimaryTenant = '', userActiveTenant = ''

  return Users.findById(id)
    .then((myUser) => {
      if(!myUser) {
        return res.status(422).json({
          message: 'Your account doesn\'t exist anymore!',
        });
      }

      userPrimaryTenant = myUser.primaryTenant;
      userActiveTenant = myUser.activeTenant;

      return
    })
    .then(() => {
      const finalContract = new Contracts(
        Object.assign(contract, {
          contractNumber: contract.contractNumber,
          company: contract.company,
          startDate: contract.startDate,
          endDate: contract.endDate,
          comment: contract.comment,
          services: contract.services,
          primaryTenant: userPrimaryTenant,
          activeTenant: userActiveTenant
        })
      )

      return finalContract.save()
        .then(() => res.json({ok: true}))
    })
});

// GET contracts
router.get('/view', auth.required, (req, res, next) => {
  const { payload: { id } } = req;

  return Users.findById(id, { primaryTenant: 1, activeTenant: 1 })
    .then((myUser) => {
      if(!myUser) {
        return res.status(422).json({
          message: 'Your account doesn\'t exist anymore!',
        });
      }

      const userPrimaryTenant = myUser.primaryTenant
      const userActiveTenant = myUser.activeTenant
      return Contracts.find({ primaryTenant: userPrimaryTenant, activeTenant: userActiveTenant }, {})
        .then((contracts) => res.json({ contracts }))
  });
});

module.exports = router;
