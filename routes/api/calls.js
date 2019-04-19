const env = require('../../env.json')
const mongoose = require('mongoose');
const moment = require('moment');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');
const Calls = mongoose.model('Calls');
const Callers = mongoose.model('Callers');

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

    .then(() => res.json({
        ok: true
      })
    );
});
//
// //POST new user route (optional, everyone has access)
// router.post('/reset-default-password', auth.optional, (req, res, next) => {
//   const { body: { password } } = req;
//   const clientUrl = req.headers.referer
//   const oldSaltAndId = clientUrl.substr(clientUrl.lastIndexOf('/') + 1)
//   const oldSalt = oldSaltAndId.substr(0, oldSaltAndId.indexOf('~'))
//   const clientId = oldSaltAndId.substr(oldSaltAndId.indexOf('~') + 1)
//
//   if(password.length === 0) {
//     return res.status(422).json({
//       errors: {
//         password: 'is required',
//       },
//     });
//   }
//
//   return Users.findOne({_id: clientId, salt: oldSalt})
//     .then((user) => {
//       if(!user) {
//         return res.status(400).json({
//           message: 'Seems that the url address has been expired!'
//         });
//       }
//
//       const finalUser = new Users(user)
//       finalUser.setPassword(password);
//
//       return finalUser.save()
//         .then(() => res.json({ ok: true }))
//     });
//
// });
//
// //POST login route (optional, everyone has access)
// router.post('/login', auth.optional, (req, res, next) => {
//   const { body: { user } } = req;
//
//   if(!user.email) {
//     return res.status(422).json({
//       errors: {
//         email: 'is required',
//       },
//     });
//   }
//
//   if(!user.password) {
//     return res.status(422).json({
//       errors: {
//         password: 'is required',
//       },
//     });
//   }
//
//   return passport.authenticate('local', { session: true }, (err, passportUser, info) => {
//     if(err) {
//       return next(err);
//     }
//
//     if(passportUser) {
//       const user = passportUser;
//       user.token = passportUser.generateJWT();
//
//       return res.json({ user: user.toAuthJSON() });
//     }
//
//     return res.status(400).json({
//       message: 'No user found with these credentials!'
//     });
//   })(req, res, next);
// });

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
