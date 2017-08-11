var express = require('express');
var router = express.Router();
var weixinConfig = require('../config/weixin.js');
var wechat = require('../modules/wechat');
var wechatApp = new wechat(weixinConfig);
var mysqlUtil = require('../common/mysqlUtil.js');
var redisUtil = require('../common/redisUtil');

var user = require('../modules/user');
var sign = require('../common/signature').sign;

var OAuth = require('wechat-oauth');
var client = new OAuth(weixinConfig.appid, weixinConfig.appsecret, function(openid, callback) {
		var sql = 'SELECT * FROM token WHERE openid = ?';
		mysqlUtil.execute(sql, [openid], function(err, result) {
			if (err) {
				return callback(err);
			}
			return callback(null, result[0]);
		});
	},
	function(openid, token, callback) {
		var sql = 'REPLACE INTO token(access_token, expires_in, refresh_token, openid, scope, create_at) VALUES(?, ?, ?, ?, ?, ?)';
		var fields = [token.access_token, token.expires_in, token.refresh_token, token.openid, token.scope, token.create_at];
		mysqlUtil.execute(sql, fields, function(err, result) {
			return callback(err);
		});
	});

/* 服务器认证和自动消息回复. */
router.all('/auth', wechatApp.auth);

// 主页,主要是负责OAuth认证
router.get('/OAuth', function(req, res) {
	// 生成引导用户点击的URL
	var url = client.getAuthorizeURL('http://' + req.hostname + '/wx/callback', '', 'snsapi_userinfo');
	res.redirect(url);
});

/**
 * 认证授权后回调函数
 */
router.get('/callback', function(req, res) {
	var code = req.query.code;
	// 用户点击上步生成的URL后会被重定向到上步设置的 redirectUrl，并且会带有code参数，我们可以使用这个code换取access_token和用户的openid
	client.getAccessToken(code, function(err, result) {
		var accessToken = result.data.access_token;
		var openid = result.data.openid;
		// 判断用户是否已存在
		user.query(openid, function(err, results) {
			if (err) {
				return res.send(404, err);
			}
			if (0 == results.length) {
				client.getUser(openid, function(err, result) {
					var userInfo = result;
					user.add(userInfo, function(err, results) {
						if (err) {
							return res.send(404, err);
						}
						res.redirect('/wx/home/');
					});
				});
			} else {
				res.redirect('/wx/home/');
			}
		});

	});
});

router.get('/home', function(req, res, next) {
	redisUtil.client().get('accessToken', function(err, reply) {
		if (err) {
			console.error(err);
		}
		if (!reply) {
			console.error("redis 找不到 accessToken");
		}
		res.render('index', {
			title: 'welcome home ',
			token: reply
		});
	});
});

router.get('/sign', function(req, res, next) {
	var url = req.query.url;
	sign(url, function(results) {
		console.log('results:', results);
		results.appId = weixinConfig.appid;
		res.json(results);
		return;
	});
});

module.exports = router;