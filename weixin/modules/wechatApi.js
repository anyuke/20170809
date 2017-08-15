var WechatAPI = require('wechat-api');
var weixinConfig = require('../config/weixin');
var redisUtil = require('../common/redisUtil');
var request = require('request');

var wechatApi = new WechatAPI(weixinConfig.appid, weixinConfig.appsecret, function(callback) {
	// 传入一个获取全局token的方法
	redisUtil.client().get(weixinConfig.weixinAccessTokenPrefix, function(err, reply) {
		logger.info('获取全局token: ', JSON.parse(reply));
		if (err) {
			return logger.error(err);
		}
		callback(null, JSON.parse(reply));
	});
}, function(token, callback) {
	// 请将token存储到全局，跨进程、跨机器级别的全局，比如写到数据库、redis等
	// 这样才能在cluster模式及多机情况下使用，以下为写入到文件的示例
	logger.info('缓存全局token', JSON.stringify(token)); // 包括accessToken和过期时间
	if (token.accessToken) {
		redisUtil.client().set(weixinConfig.weixinAccessTokenPrefix, JSON.stringify(token));
		request.post('https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=ACCESS_TOKEN&type=jsapi', {
			form: {
				access_token: token.accessToken,
				type: 'jsapi'
			}
		}, function(err, rsp, body) {
			if (err) {
				logger.error(err);
				return;
			}
			if (JSON.parse(body).errcode) {
				logger.error("weixin api getticket error : %s", JSON.parse(body).errmsg);
				return;
			}
			var ticket = JSON.parse(body).ticket;
			logger.info('缓存全局ticket', ticket);
			if (ticket) {
				redisUtil.client().setex(weixinConfig.weixinTicketPrefix, weixinConfig.weixinExpireTime, ticket);
			}
		});
	}
	callback(null, token);
});

exports.createMenu = function(menu, callback) {
	wechatApi.createMenu(menu, function(err, results) {
		logger.info('-------------创建菜单-------------');
		if (err) {
			return callback(err);
		}
		return callback();
	});
};

exports.deliverNotify = function(data, callback) {
	wechatApi.deliverNotify(data, callback);
};