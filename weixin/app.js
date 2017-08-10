var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mysqlUtil = require('./common/mysqlUtil.js');
var index = require('./routes/index');
var users = require('./routes/users');
var WechatAPI = require('wechat-api');
var menu = require('./config/menu.js');
var weixinConfig = require('./config/weixin.js');
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
	console.log('token: \n', token);
	var sql = 'REPLACE INTO access_token(access_token, expires_in) VALUES(?, ?)';
	var fields = [token.access_token, token.expires_in];
	mysqlUtil.execute(sql, fields, function(err, result) {
		return callback(err);
	});
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
	api.createMenu(menu.wx_menu, function (err, results) {
		if (err) {
			next(err);
		}
		next();
	});
});

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
