module.exports = function (req, res, next) {
	logger.info('req.session.openid: ', req.session.openid);
	// console.log('req.session.userId: ', req.session.userId);
	if (!req.session.openid) {
		return res.redirect('http://' + req.hostname + '/wx/OAuth');
	}
	// } else if (!req.session.userId) {
	// 	return res.redirect('http://' + req.hostname + '/wx/login');
	// }
	next();
};