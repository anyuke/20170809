module.exports = function (req, res, next) {
	console.log('req.session.openid: ', req.session.openid);
	if (!req.session.openid) {
		return res.redirect('http://' + req.hostname + '/wx/OAuth');
	}
	next();
};