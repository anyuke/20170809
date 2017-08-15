var express = require('express');
var router = express.Router();
var weixinConfig = require('../config/weixin.js');
var wechatApp = require('../modules/wechat');
var mysqlUtil = require('../common/mysqlUtil.js');
var login_check = require('../common/login_check');
var user = require('../modules/user');
var sign = require('../common/signature').sign;

var OAuth = require('wechat-oauth');

var client = new OAuth(weixinConfig.appid, weixinConfig.appsecret, function(openid, callback) {
		logger.info('网页授权 获取用户信息');
		var sql = 'SELECT * FROM token WHERE openid = ?';
		mysqlUtil.execute(sql, [openid], function(err, result) {
			if (err) {
				return callback(err);
			}
			return callback(null, result[0]);
		});
	},
	function(openid, token, callback) {
		logger.info('网页授权 缓存token');
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
	return res.redirect(url);
});

/**
 * 认证授权后回调函数
 */
router.get('/callback', function(req, res) {
	var code = req.query.code;
	// 用户点击上步生成的URL后会被重定向到上步设置的 redirectUrl，并且会带有code参数，我们可以使用这个code换取access_token和用户的openid
	client.getAccessToken(code, function(err, result) {
		if (err) {
			return console.eror('oauth error: ', err);
		}
		var accessToken = result.data.access_token;
		var openid = result.data.openid;
		req.session.openid = openid;
		client.getUser(openid, function(err, result) {
			var userInfo = result;
			req.session.nickname = userInfo.nickname;
			user.add(userInfo, function(err, results) {
				if (err) {
					return res.send(404, err);
				}
				return res.redirect('/wx/home/');
			});
		});
	});
});

router.get('/sign', function(req, res, next) {
	var url = req.query.url;
	sign(url, function(results) {
		results.appId = weixinConfig.appid;
		res.json(results);
	});
});

router.get('/home', login_check, function(req, res, next) {
	res.render('home', {
		title: '首页'
	});
});

router.get('/order', function(req, res, next) {
	var data = {
		"appid": "wwwwb4f85f3a797777",
		"openid": "oGHT7vrbHrmPMeZx4ejL5qnVTOTs",
		"transid": "111112222233333",
		"out_trade_no": "555666uuu",
		"deliver_timestamp": "1369745073",
		"deliver_status": "1",
		"deliver_msg": "ok",
		"app_signature": "53cca9d47b883bd4a5c85a9300df3da0cb48565c",
		"sign_method": "sha1"
	};
	wechatApi.deliverNotify(data, function(err, results) {
		if (err) {
			logger.error(err);
			res.json({
				code: -1,
				message: err
			});
			return;
		}
		res.json({
			code: 200,
			message: results
		});
		return;
	});
});
// router.get('/login', function(req, res, next) {
// 	res.render('login', {title: "登录页"});
// });

// router.post('/login', function (req, res, next) {
// 	console.log('post login');
// 	res.json({
// 		code: 1,
// 		message: "success"
// 	});
// });

module.exports = router;