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