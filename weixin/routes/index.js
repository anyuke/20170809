var express = require('express');
var router = express.Router();
var weixinConfig = require('../config/weixin.js');
var wechatApp = require('../modules/wechat');
var mysqlUtil = require('../common/mysqlUtil.js');
var login_check = require('../common/login_check');
var user = require('../modules/user');
var sign = require('../common/signature').sign;
var request = require('request');
var redisUtil = require('../common/redisUtil');
var async = require('async');

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

// 获取已获得的所有模板列表
router.get('/get_all_private_template', function(req, res, next) {
	redisUtil.client().get(weixinConfig.weixinAccessTokenPrefix, function(err, reply) {
		if (err) {
			return logger.error(err);
		}
		request.get('https://api.weixin.qq.com/cgi-bin/template/get_all_private_template?access_token=' + JSON.parse(reply).accessToken,
			function(err, rsp, body) {
				if (err) {
					logger.error(err);
					res.json({
						code: -1,
						data: err
					});
					return;
				}
				if (JSON.parse(body).errcode) {
					logger.error("get_all_private_template error : %s", JSON.parse(body).errmsg);
					res.json({
						code: -1,
						data: JSON.parse(body).errmsg
					});
					return;
				}
				var template_list = JSON.parse(body).template_list;
				res.json({
					code: 200,
					data: template_list
				});
			});
	});
});

// 发送模板消息
router.get('/send_template_msg', function(req, res, next) {
	redisUtil.client().get(weixinConfig.weixinAccessTokenPrefix, function(err, reply) {
		if (err) {
			return logger.error(err);
		}
		var data = {
			"touser": "oGHT7vrbHrmPMeZx4ejL5qnVTOTs",
			"template_id": "6XA0yrQFHZd2Bqg1qX_PfYdTfV4uY3pdzmxs7tFgbmk",
			"url": "http://weixin.qq.com/download",
			"data": {
				"first": {
					"value": "恭喜你购买成功！",
					"color": "#173177"
				},
				"keyword1": {
					"value": "巧克力",
					"color": "#173177"
				},
				"keyword2": {
					"value": "39.8元",
					"color": "#173177"
				},
				"keyword3": {
					"value": "2014年9月22日",
					"color": "#173177"
				},
				"remark": {
					"value": "欢迎再次购买！",
					"color": "#173177"
				}
			}
		};
		request({
			url: 'https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=' + JSON.parse(reply).accessToken,
			method: "POST",
			json: true,
			headers: {
				"content-type": "application/json",
			},
			body: data
		}, function(err, rsp, body) {
			if (err) {
				logger.error(err);
				res.json({
					code: -1,
					data: err
				});
				return;
			}
			if (body.errcode) {
				logger.error("get_all_private_template error : %s", body.errmsg);
				res.json({
					code: -1,
					data: body.errmsg
				});
				return;
			}
			res.json({
				code: 200,
				data: "SUCCESS"
			});
		});
	});
});

// 拉取用户列表
router.get('/userList', function (req, res, next) {
	redisUtil.client().get(weixinConfig.weixinAccessTokenPrefix, function(err, reply) {
		if (err) {
			return logger.error(err);
		}
		request.get('https://api.weixin.qq.com/cgi-bin/user/get?access_token=' + JSON.parse(reply).accessToken,
			function(err, rsp, body) {
				if (err) {
					logger.error(err);
					res.json({
						code: -1,
						data: err
					});
					return;
				}
				if (JSON.parse(body).errcode) {
					logger.error("userList error : %s", JSON.parse(body).errmsg);
					res.json({
						code: -1,
						data: JSON.parse(body).errmsg
					});
					return;
				}
				res.json({
					code: 200,
					data: JSON.parse(body)
				});
			});
	});
});

// 生成临时二维码
router.get('/qrcode', function (req, res, next) {
	async.auto({
		'get_ticket': function (cb) {
			redisUtil.client().get(weixinConfig.weixinAccessTokenPrefix, function(err, reply) {
				if (err) {
					return cb(err);
				}
				var data = {
					"expire_seconds": 604800, 
					"action_name": "QR_SCENE", 
					"action_info": {
						"scene": {"scene_id": 123}
					}
				};
				request({
					url: 'https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=' + JSON.parse(reply).accessToken,
					method: "POST",
					json: true,
					headers: {
						"content-type": "application/json",
					},
					body: data
				}, function(err, rsp, body) {
					if (err) {
						return cb(err);
					}
					if (body.errcode) {
						return cb(err);
					}
					cb(null, body.ticket);
				});
			});
		},
		'get_qrcode_by_ticket': ['get_ticket', function (data, cb) {
			var qrcode_url = 'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=' + encodeURI(data.get_ticket);
			cb(null, qrcode_url);
		}]
	}, function (err, results) {
		if (err) {
			logger.error(err);
			res.json({
				code: -1,
				msg: err
			});
			return;
		}
		res.render('qrcode', {img: results.get_qrcode_by_ticket});
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