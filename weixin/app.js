var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var log = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var index = require('./routes/index');
var users = require('./routes/users');
var ejs = require('ejs');  //我是新引入的ejs插件

var redisConfig = require('./config/redis');
var menu = require('./config/menu').wx_menu;
global.rootdir = __dirname;
global.logger = require('./common/logger');
global.wechatApi = require('./modules/wechatApi');

// var task = require('./task/weixin');
// task.refresh(); // 定时刷新toekn jsapi-ticket // 因为wechat-api组件会自动刷新toekn，所以暂时屏蔽掉这个定时器


// 创建菜单
wechatApi.createMenu(menu, function (err, result) {
	if (err) {
		return logger.error(err);
	}
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', ejs.__express);
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(log('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// session
var session = null;
session = require('express-session');

var RedisStore = require('connect-redis')(session);

var REDIS_OPT = {};
REDIS_OPT.host = redisConfig.host;
REDIS_OPT.port = redisConfig.port;
REDIS_OPT.db = redisConfig.db;

if (redisConfig.opts && redisConfig.opts.auth_pass) {
    REDIS_OPT.password = redisConfig.opts.auth_pass;
}

var store = new RedisStore(REDIS_OPT);

app.locals.store = store;

app.use(session({
    name: 'weixin_session',
    secret: 'lyf2017811', // 建议使用 128 个字符的随机字符串
    cookie: {
        path: '/',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24小时后过期
    },
    resave: true,
    saveUninitialized: false,
    store: store,
}));

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