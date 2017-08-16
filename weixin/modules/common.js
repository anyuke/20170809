var utils = require('../common/utils');

module.exports = {
	writeLog: function(req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,POST');
        res.header('Access-Control-Allow-Headers', 'token,id,mobile');
        logger.debug("req headers :%j", req.headers);
        logger.info('[请求][' + utils.getClientIp(req) + ']', req.method, req.originalUrl, req.method != 'GET' ? JSON.stringify(req.body) : '');
        return next();
    }
};