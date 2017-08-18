module.exports = function (req, res, next) {
	logger.info('req.session.openid: ', req.session.openid);
	if (!req.session.openid) {
		return res.redirect('http://' + req.hostname + '/wx/OAuth');
	}
	next();
};