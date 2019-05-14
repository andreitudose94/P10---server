const express = require('express');
const router = express.Router();

router.use('/users', require('./users'));
router.use('/companies', require('./companies'));
router.use('/callers', require('./callers'));
router.use('/responsibles', require('./responsibles'));
router.use('/calls', require('./calls'));
router.use('/missions', require('./missions'));
router.use('/messages', require('./messages'));

module.exports = router;
