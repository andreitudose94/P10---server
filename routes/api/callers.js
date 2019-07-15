const env = require('../../env.json')
const mongoose = require('mongoose');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');
const Callers = mongoose.model('Callers');
const Companies = mongoose.model('Companies');
const nodemailer = require('nodemailer');
const Promise = require('bluebird');

const emailInit = (sendTo, subject, html) => {

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.APLICATION_EMAIL,
      pass: env.APLICATION_PASSWORD
    }
  });

  const mailOptions = {
    from: env.APLICATION_EMAIL,
    to: sendTo,
    subject: subject,
    html: html
  };

  return { transporter: transporter, mailOptions: mailOptions }
}

const sendEmail = (transporter, mailOptions) =>
  new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        reject(error)
      } else {
        console.log('Email sent: ' + info.response);
        resolve(info)
      }
    });
  });

//POST new user (auth required)
router.post('/new', auth.required, (req, res, next) => {
  const { payload: { id } } = req;
  const { body: { caller } } = req;

  if(!caller.name) {
    return res.status(422).json({
      errors: {
        name: 'is required',
      },
    });
  }

  if(!caller.ssn) {
    return res.status(422).json({
      errors: {
        email: 'is required',
      },
    });
  }

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

      return Callers.findOne({ssn: caller.ssn})
    })
    .then((existingCaller) => {
      if(existingCaller) {
        return res.status(422).json({
          message: 'Caller already exists!',
        });
      }

      // we add the role to the user
      const finalCaller = new Callers(Object.assign(caller, {
        name: caller.name,
        ssn: caller.ssn,
        company: caller.company,
        companyId: caller.companyId,
        primaryTenant: userPrimaryTenant,
        activeTenant:  userActiveTenant
      }));

      return finalCaller.save()
        .then(() => Companies.findById(caller.companyId))
        .then((company) => {
          const subject = 'A new client has been created for your company on FMS (Field Mission Support)'
          const html = `
            <p>
              Hello dear company! <br />
              A new customer has been created for you. His name is ${finalCaller.name}. <br />
              Thanks, <br />
              The Paco team
            </p>
          `
          const { transporter, mailOptions } = emailInit(company.email, subject, html)
          return sendEmail(transporter, mailOptions)
        })
        .then(() => res.json({
          caller: {
            _id: finalCaller._id,
            company: finalCaller.company,
            companyId: finalCaller.companyId,
            name: finalCaller.name,
            ssn: finalCaller.ssn
          }
        }));
    })
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


//GET all companies (required, only authenticated users have access)
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

      return Callers.find({ primaryTenant: userPrimaryTenant, activeTenant: userActiveTenant }, { name: 1, ssn: 1, company: 1, companyId: 1 })
        .then((callers) => res.json({ callers }))
    });
});

module.exports = router;
