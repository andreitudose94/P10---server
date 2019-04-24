const env = require('../../env.json')
const mongoose = require('mongoose');
const moment = require('moment');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');
const Calls = mongoose.model('Calls');
const Callers = mongoose.model('Callers');
const Missions = mongoose.model('Missions');

//POST new user (auth required)
router.post('/new', auth.required, (req, res, next) => {
  const { payload: { id } } = req;
  const { body: { newCall } } = req;

  if(!newCall.caller) {
    return res.status(422).json({
      errors: {
        caller: 'is required',
      },
    });
  }

  if(!newCall.eventAddress) {
    return res.status(422).json({
      errors: {
        'Event Address': 'is required',
      },
    });
  }

  if(!newCall.responsible) {
    return res.status(422).json({
      errors: {
        responsible: 'is required',
      },
    });
  }

  let userPrimaryTenant = '', userActiveTenant = ''
  let callIndex = ''

  return Users.findById(id)
    .then((myUser) => {
      if(!myUser) {
        return res.status(422).json({
          message: 'Your account doesn\'t exist anymore!',
        });
      }

      userPrimaryTenant = myUser.primaryTenant
      userActiveTenant = myUser.activeTenant

      return Calls.countDocuments({})
    })

    .then((callsCount) => {

      const newCallsCount = callsCount + 1
      console.log('newCallsCount', newCallsCount);
      callIndex = Array(9 - newCallsCount.toString().length).join("0") + "" + newCallsCount
      const callerSSN = newCall.caller.split(' | ')[2].trim()
      return Callers.findOne({ ssn: callerSSN }, { companyId: 1 })

    })

    .then((callerReturnedInfo) => {

      const finalCall = new Calls(Object.assign(newCall, {
        index: callIndex,
        callerCompany: callerReturnedInfo.companyId,
        status: 'Assigned',
        primaryTenant: userPrimaryTenant,
        activeTenant:  userActiveTenant
      }));

      return finalCall.save()
    })

    .then((savedCall) => {

      const finalMission = new Missions({
        call_id: savedCall._id,
        call_index: savedCall.index,
        estimatedStartDateTime: savedCall.promisedDateTime,
        effectiveStartDateTime: '',
        estimatedEndDateTime: '',
        effectiveEndDateTime: '',
        summary: savedCall.summary,
        contact: savedCall.contact,
        contactPhoneNo: savedCall.contactPhoneNo,
        contactAddress: savedCall.contactAddress,
        responsible: savedCall.responsible,
        responsibleGeolocation: savedCall.responsibleGeolocation,
        eventAddress: savedCall.eventAddress,
        eventAddressGeolocation: savedCall.eventAddressGeolocation,
        tokenImages: [],
        file: {},
        signature: '',
        status: savedCall.status,
        primaryTenant: userPrimaryTenant,
        activeTenant:  userActiveTenant,
        modifiedAt: new Date()
      });

      return finalMission.save()
    })

    .then(() => res.json({
        ok: true
      })
    );
});

//GET all calls which corresponds to sent filter from client (required, only authenticated users have access)
router.post('/all-filtered', auth.required, (req, res, next) => {
  const { payload: { id } } = req;
  const { body: { filters } } = req;

  let userPrimaryTenant = '', userActiveTenant = ''
  let callIndex = ''

  return Users.findById(id)
    .then((myUser) => {
      if(!myUser) {
        return res.status(422).json({
          message: 'Your account doesn\'t exist anymore!',
        });
      }

      userPrimaryTenant = myUser.primaryTenant
      userActiveTenant = myUser.activeTenant

      const { afterDate, responsible } = filters

      let applyFilters = {}
      if(afterDate) {
        applyFilters['datetime'] = {
          $gte : afterDate
        }
      }

      if(responsible) {
        applyFilters['responsible'] = responsible
      }

      return Calls.find(
        Object.assign({
          primaryTenant: userPrimaryTenant,
          activeTenant: userActiveTenant
        },
          applyFilters
        )
      )
    })

    .then((calls) => res.json({ calls }))
});

//GET all calls (required, only authenticated users have access)
router.get('/all', auth.required, (req, res, next) => {
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

      return Calls.find({ primaryTenant: userPrimaryTenant, activeTenant: userActiveTenant })
        .then((calls) => res.json({ calls }))
    });
});

module.exports = router;
