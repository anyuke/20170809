var express = require('express');
var router = express.Router();
var weixinConfig = require('../config/weixin.js');
var mysqlUtil = require('../common/mysqlUtil.js');
var user = require('../modules/user.js');
var menu = require('../config/menu.js');
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

var WechatAPI = require('wechat-api');

var api = new WechatAPI(weixinConfig.appid, weixinConfig.appsecret, function(callback) {
	// 传入一个获取全局token的方法
	var sql = 'SELECT * FROM access_token';
	mysqlUtil.execute(sql, [], function(err, result) {
		if (err) {
			return callback(err);
		}
		return callback(null, result[0]);
	});
}, function(token, callback) {
	// 请将token存储到全局，跨进程、跨机器级别的全局，比如写到数据库、redis等
	// 这样才能在cluster模式及多机情况下使用，以下为写入到文件的示例
	var sql = 'REPLACE INTO access_token(access_token, expires_in) VALUES(?, ?)';
	var fields = [token.access_token, token.expires_in];
	mysqlUtil.execute(sql, fields, function(err, result) {
		return callback(err);
	});
});

api.createMenu(menu.wx_menu, callback);

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
						if (!req.session) {
							req.session = {};
						}
						res.redirect('/wx/home/?nickname=' + userInfo.nickname);
					});
				});
			} else {
				if (!req.session) {
					req.session = {};
				}
				res.redirect('/wx/home/?nickname=' + results[0].nickname);
			}
		});

	});
});

router.get('/home', function(req, res, next) {
	res.render('index', {
		title: 'welcome home ' + req.query.nickname
	});
});

module.exports = router;