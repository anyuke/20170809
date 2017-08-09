var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/weixin', require('../modules/wechat'));

module.exports = router;
