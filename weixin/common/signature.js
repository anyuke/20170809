var request = require('request');
var sha1 = require('sha1');
var config = require('../config/weixin');
var redisUtil = require('./redisUtil');

exports.sign = function(url, callback) {
	var noncestr = config.noncestr;
	var timestamp = Math.floor(Date.now() / 1000); //精确到秒
	var jsapi_ticket;
	redisUtil.client().get('ticket', function(err, reply) {
		if (err) {
			console.error(err);
		}
		if (!reply) {
			request(config.accessTokenUrl + '?grant_type=' + config.grant_type + '&appid=' + config.appid + '&secret=' + config.appsecret, function(error, response, body) {
				if (!error && response.statusCode == 200) {
					var tokenMap = JSON.parse(body);
					request(config.ticketUrl + '?access_token=' + tokenMap.access_token + '&type=jsapi', function(error, resp, json) {
						if (!error && response.statusCode == 200) {
							var ticketMap = JSON.parse(json);
							redisUtil.client().setex('ticket', config.cache_duration, ticketMap.ticket); //加入缓存
							console.log('jsapi_ticket=' + ticketMap.ticket + '&noncestr=' + noncestr + '×tamp=' + timestamp + '&url=' + url);
							callback({
								noncestr: noncestr,
								timestamp: timestamp,
								url: url,
								jsapi_ticket: ticketMap.ticket,
								signature: sha1('jsapi_ticket=' + ticketMap.ticket + '&noncestr=' + noncestr + '×tamp=' + timestamp + '&url=' + url)
							});
						}
					});
				}
			});
		} else {
			jsapi_ticket = reply;
			console.log('1' + 'jsapi_ticket=' + jsapi_ticket + '&noncestr=' + noncestr + '×tamp=' + timestamp + '&url=' + url);
			callback({
				noncestr: noncestr,
				timestamp: timestamp,
				url: url,
				jsapi_ticket: jsapi_ticket,
				signature: sha1('jsapi_ticket=' + jsapi_ticket + '&noncestr=' + noncestr + '×tamp=' + timestamp + '&url=' + url)
			});
		}
	});
};