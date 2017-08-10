var express = require('express');
var router = express.Router();
var weixinConfig = require('../config/weixin.js');
var mysqlUtil = require('../common/mysqlUtil.js');
var user = require('../modules/user.js');

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

/* 自动回复. */
router.all('/weixin',
	require('../modules/wechat').handler);

// 主页,主要是负责OAuth认真
router.get('/', function(req, res) {
	var url = client.getAuthorizeURL('http://' + req.hostname + '/wx/callback', '', 'snsapi_userinfo');
	res.redirect(url);
});

/**
 * 认证授权后回调函数
 */
router.get('/callback', function(req, res) {
	var code = req.query.code;
	client.getAccessToken(code, function(err, result) {
		var accessToken = result.data.access_token;
		var openid = result.data.openid;
		// 判断用户是否已存在
		user.query(openid, function (err, results) {
			if (err) {
				return res.send(404, err);
			}
			if (0 == results.length) {
				client.getUser(openid, function(err, result) {
					var userInfo = result;
					console.log('userInfo:');
					console.log(userInfo);
					if (!req.session) {
						req.session = {};
					}
					req.session.userId = userInfo.openid;
					req.session.nickname = userInfo.nickname;
					res.redirect('/wx/home/');
				});
			} else {
				if (!req.session) {
					req.session = {};
				}
				req.session.userId = results[0].openid;
				req.session.nickname = results[0].nickname;
				res.redirect('/wx/home/');
			}
		});
		
	});
});

router.get('/home', function(req, res, next) {
	res.render('index', {
		title: 'WELCOME!!!'
	});
});

module.exports = router;