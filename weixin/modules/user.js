var mysqlUtil = require('../common/mysqlUtil');
var redisUtil = require('../common/redisUtil');
var lib_token = require("../../common/token");
var utils = require('../common/utils');
var config = require('../config/index');
var message = require('../common/message');
var async = require('async');

const KEY_ROLE_PREFIX = "KEY_ROLE_";

// callback 格式:cb(err, authMap);
function setRedisRoleMap(roleId, callback) {
    logger.info("set role map roleId:%d", roleId);

    if (!utils.number_check(roleId)) {
        return callback(new Error("roleId不是数字"));
    }
    var sql = "select t.authId from tb_position_auth t where t.positionId = ?";
    roleId = parseInt(roleId);
    mysqlUtil.execute(sql, [roleId], function (err, result) {
        if (err) {
            logger.error(err);
            callback(err);
            return;
        }
        var authMap = {};
        for (var i = 0; i < result.length; i++) {
            authMap["" + result[i].authId] = true;
        }
        var keyRole = KEY_ROLE_PREFIX + roleId;
        var authValue = JSON.stringify(authMap);
        redisUtil.client().setex(keyRole, config.tokenExpireTime, authValue, function (err) {
            if (err) {
                logger.error(err);
                callback(err);
                return;
            }
            callback(null, authMap);
        });
    });
}

function updateRedisRole(roleId, authMap) {
    logger.info("update role:%d", roleId);
    authMap = authMap || {};
    var keyRole = KEY_ROLE_PREFIX + roleId;
    var authValue = JSON.stringify(authMap);
    redisUtil.client().setex(keyRole, config.tokenExpireTime, authValue);
}

function removeRedisRole(roleId) {
    var keyRole = KEY_ROLE_PREFIX + roleId;
    redisUtil.client().DEL(keyRole);
}

function permissionMiddleware(permissionid) {
    return function (req, res, next) {
        if (!req.session || !req.session.roleId) {
            return utils.response(res, { code: -2, message:"无此权限" });
        }
        if (req.session.roleId == SUPER_USER_POS_ID) {
            // 超级管理员有所有权限
            return next();
        }
        if (permissionid instanceof Array) {
            for (var i = 0; i < permissionid.length; i++) {
                if (req.session.authMap["" + permissionid[i]] == true) {
                    delete req.session.authMap;
                    return next();
                }
            }
            return utils.response(res, { code: -2, message: "无此权限" });
        }
        if (req.session.authMap["" + permissionid] == true) {
            delete req.session.authMap;
            return next();
        }
        return utils.response(res, { code: -2, message: "无此权限" });
    }
}

module.exports = {

	register: function (req, res) {

		var mobileNum = req.body.mobileNum;
		var password = req.body.password;
		var name = req.body.name;
		var sex = req.body.sex;
		var role = req.body.role || 99;
		
		var check_params = [
			{ type: 'string', value: mobileNum, not_null: true },
			{ type: 'string', value: password, not_null: true },
			{ type: 'string', value: name, not_null: true },
			{ type: 'number', value: sex, not_null: true },
			{ type: 'number', value: role, not_null: true }
		];

		if (!utils.param_check(check_params)) {
			return utils.response(res, message.PARAMS_MISSING);
		}

		if (!utiils.isValidMobileNum(mobileNum)) {
			return utils.response(res, message.INVALID_MOBILE);
		}

		var sql = "";
		var param = "";
		async.auto({
			'judge_mobile': function (cb) {
				sql = "select count(id) sum from tb_user where mobileNum = ?";
				param = [mobileNum];
				mysqlUtil.execute(sql, param, function (err, result) {
					if (err) {
						return cb(err);
					}
					if (result[0].sum > 0) {
						return cb('用户已存在');
					}
					cb();
				});
			},
			'insert_user': ['judge_mobile', function (data, cb) {
				sql = "insert into tb_user set ?";
				param = [{
					mobileNum: mobileNum,
					password: password,
					name: name,
					sex: parseInt(sex),
					role: parseInt(role),
					createTime: Date.now(),
					updateTime: Date.now()
				}];
				mysqlUtil.execute(sql, param, function (err, result) {
					if (err) {
						return cb(err);
					}
					cb();
				});
			}]
		}, function (err, results) {
			if (err) {
				logger.error(err);
				return utils.response(res, message.SYSTEM_ERROR);
			}
			return utils.response(res, message.SUCCESS);
		});
	},

	login: function (req, res) {
		var mobileNum = req.body.mobileNum;
		var password = req.body.password;

		var check_params = [
			{ type: 'string', value: mobileNum, not_null: true },
			{ type: 'string', value: password, not_null: true }
		];

		if (!utils.param_check(check_params)) {
			return utils.response(res, message.PARAMS_MISSING);
		}
		if (!utiils.isValidMobileNum(mobileNum)) {
			return utils.response(res, message.INVALID_MOBILE);
		}

		var sql = "select t.id, t.role, t.mobileNum, t.name from tb_user t where t.mobileNum = ? and t.password = ?";
        var params = [mobileNum, password];
        mysqlUtil.execute(sql, params, function(err, result) {
            if (err) {
                logger.error(err);
                return utils.response(res, message.SYSTEM_ERROR);
            }
            if (result.length == 0) {
                return utils.response(res, { code: -1, message: "账号或密码错误" });
            }
            var row = result[0];
            req.session.uid = parseInt(row.id);
            req.session.roleId = parseInt(row.role) || 0;
            req.session.name = row.name;
            return utils.response(res, {code: 0, message: "success", data: {userName: row.name}});
        });
	},

	// 退出登录
    quit: function(req, res) {
        if (!req.session) {
            return utils.response(res, message.SUCCESS);
        }
        req.session.uid = null;
        req.session.roleId = null;
        req.session.name = null;
        return utils.response(res, message.SUCCESS);
    },

    // 检查登录
    login_check: function(req, res, next) {
        if (utils.isContains(['/common/redis', '', '/', '/user/login'], req.baseUrl)) {
            return next();
        }
        if (!req.session || !req.session.uid || !req.session.roleId || !req.session.name) {
        	return utils.response(res, message.NEED_LOGIN);
        }

        var uid = req.session.uid;
        var roleId = req.session.roleId;
        var keyRole = KEY_ROLE_PREFIX + roleId;
        // 获取职位的权限
        redisUtil.client().get(keyRole, function (err, reply) {
            if (err) {
                logger.error(err);
                return utils.response(res, message.NEED_LOGIN);
            }

            if (!reply || typeof (reply) != "string" ||  reply.length == 0) {
                setRedisRoleMap(roleId, function (err, authMap) {
                    if (err) {
                        logger.error(err);
                        return utils.response(res, message.NEED_LOGIN);
                    }
                    req.session.authMap = authMap;
                    return next();
                });
                return;
            }

            var authMap = {};
            try {
                authMap = JSON.parse(reply);
            } catch (error) {
                logger.error(error);
                return utils.response(res, message.NEED_LOGIN);
            }
            req.session.authMap = authMap;
            return next();
        });
    },

	roleList: function (req, res) {
		var sql = "select * from tb_position where state  = 1";
		mysqlUtil.execute(sql, [], function (err, result) {
			if (err) {
				logger.error(err);
				return utils.response(res, message.SYSTEM_ERROR);
			}
			return utils.response(res, { code: 200, message: "SUCCESS", data: result });
		});
	},

	query: function (openid, callback) {
		var sql = " select * from user where openid = ?";
		var param = [openid];
		mysqlUtil.execute(sql, param, function (err, results) {
			if (err) {
				return callback(err);
			}
			return callback(null, results);
		});
	},

	add: function (userInfo, callback) {
		var sql = 'INSERT INTO user SET ? ON DUPLICATE KEY UPDATE nickname = ?, sex = ?, province = ?, city = ?, country = ?, headimgurl = ?, unionid = ?, updateTime = ?';
	    var value = {
	        openid: userInfo.openid,
	        nickname: userInfo.nickname,
	        sex: userInfo.sex,
	        province: userInfo.province,
	        city: userInfo.city,
	        country: userInfo.country,
	        headimgurl: userInfo.headimgurl,
	        unionid: userInfo.unionid,
	        createTime: Date.now(),
	        updateTime: Date.now()
	    };
	    var params = [value, userInfo.nickname, userInfo.sex, userInfo.province, userInfo.city, userInfo.country, userInfo.headimgurl, userInfo.unionid, Date.now()];
	    mysqlUtil.execute(sql, params, function (err, results) {
	    	if (err) {
				return callback(err);
			}
			return callback();
	    });
	}
};