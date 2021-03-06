const env = require('../../env.json')
const mongoose = require('mongoose');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');
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

const generateRandomPassword = (length) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

//POST new user (auth required)
router.post('/new', auth.required, (req, res, next) => {
  const { payload: { id } } = req;
  const { body: { company } } = req;
  const clientHost = req.headers.origin

  if(!company.name) {
    return res.status(422).json({
      errors: {
        name: 'is required',
      },
    });
  }

  if(!company.email) {
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

      return Companies.findOne({email: company.email})
    })
    .then((existingCompany) => {
      if(existingCompany) {
        return res.status(422).json({
          message: 'Email already exists!',
        });
      }

      // here we should add an algorithm to generate default password
      const password = generateRandomPassword(15)

      // we add the role to the user
      const finalCompany = new Companies(Object.assign(company, {
        name: company.name,
        password: password,
        email: company.email,
        address: company.address,
        primaryTenant: userPrimaryTenant,
        activeTenant:  userActiveTenant
      }));

      finalCompany.setPassword(password);

      return finalCompany.save()
        .then(() => {
          const subject = 'Reset your password on FMS (Field Mission Support)'
          const html = `
            <p>
              Hello dear client! <br />
              Click the link below to reset your password on FMS app for you company. <br />
              <a href='${clientHost + "/reset-default-password-company/" + finalCompany.salt + "~" + finalCompany._id}'> Reset Password from here </a> <br />
              Thanks, <br />
              The Paco team
            </p>
          `
          const { transporter, mailOptions } = emailInit(company.email, subject, html)
          sendEmail(transporter, mailOptions)
        })
        .then(() => res.json({ ok: true }));
    })
});

//POST new user route (optional, everyone has access)
router.post('/reset-default-password', auth.optional, (req, res, next) => {
  const { body: { password } } = req;
  const clientUrl = req.headers.referer
  const oldSaltAndId = clientUrl.substr(clientUrl.lastIndexOf('/') + 1)
  const oldSalt = oldSaltAndId.substr(0, oldSaltAndId.indexOf('~'))
  const companyId = oldSaltAndId.substr(oldSaltAndId.indexOf('~') + 1)

  if(password.length === 0) {
    return res.status(422).json({
      errors: {
        password: 'is required',
      },
    });
  }

  return Companies.findOne({_id: companyId, salt: oldSalt})
    .then((company) => {
      if(!company) {
        return res.status(400).json({
          message: 'Seems that the url address has been expired!'
        });
      }

      const finalCompany = new Companies(company)
      finalCompany.setPassword(password);

      return finalCompany.save()
        .then(() => res.json({ ok: true }))
    });

});
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

//POST verify company passport (auth required)
router.post('/verify-company-password', auth.required, (req, res, next) => {
  const { payload: { id } } = req;
  const { body: { companyId, password } } = req;

  if(!companyId) {
    return res.status(422).json({
      errors: {
        company: 'is required',
      },
    });
  }

  if(!password) {
    return res.status(422).json({
      errors: {
        password: 'is required',
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
      return Companies.findOne({ _id: companyId }, { salt: 1, hash: 1 })
        .then((company) => res.json({ validate: company.validatePassword(password) }))
    })
})

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
      return Companies.find({ primaryTenant: userPrimaryTenant, activeTenant: userActiveTenant }, { name: 1, email: 1, address: 1 })
        .then((companies) => res.json({ companies }))
    });
});

module.exports = router;
