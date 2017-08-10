var mysqlUtil = require('../common/mysqlUtil.js');

module.exports = {
	query: function (openid, callback) {
		var sql = " select * from token where openid = ?";
		var param = [openid];
		mysqlUtil.execute(sql, param, function (err, results) {
			if (err) {
				return callback(err);
			}
			return callback(null, results);
		});
	}
};