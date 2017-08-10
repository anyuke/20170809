var mysqlUtil = require('../common/mysqlUtil.js');

module.exports = {
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
		var sql = "insert into user set ?";
	    var value = {
	        openid: userInfo.openid,
	        nickname: userInfo.nickname,
	        sex: userInfo.sex,
	        province: userInfo.province,
	        city: userInfo.city,
	        country: userInfo.country,
	        headimgurl: userInfo.headimgurl,
	        unionid: userInfo.unionid,
	    };

	    mysqlUtil.execute(sql, [value], function (err, results) {
	    	if (err) {
				return callback(err);
			}
			return callback();
	    });
	}
};