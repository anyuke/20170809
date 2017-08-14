var request = require('request');
var sha1 = require('sha1');
var weixinConfig = require('../config/weixin');
var redisUtil = require('./redisUtil');

exports.sign = function(url, callback) {
	var noncestr = weixinConfig.noncestr;
	var timestamp = Math.floor(Date.now() / 1000); //精确到秒
	redisUtil.client().get(weixinConfig.weixinTicketPrefix, function(err, reply) {
		if (err) {
			return logger.error(err);
		}
		callback({
			noncestr: noncestr,
			timestamp: timestamp,
			url: url,
			jsapi_ticket: reply,
			signature: sha1('jsapi_ticket=' + reply + '&noncestr=' + noncestr + '&timestamp=' + timestamp + '&url=' + url)
		});
	});
};