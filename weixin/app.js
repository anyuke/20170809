var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var log = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var index = require('./routes/index');
var users = require('./routes/users');
var WechatAPI = require('wechat-api');
var menu = require('./config/menu');
var weixinConfig = require('./config/weixin');
var redisConfig = require('./config/redis');
var redisUtil = require('./common/redisUtil');
var request = require('request');
var ejs = require('ejs');  //我是新引入的ejs插件
global.rootdir = __dirname;
global.logger = require('./common/logger');

var task = require('./task/weixin');
task.refresh(); // 定时刷新toekn jsapi-ticket


global.wechatApi = new WechatAPI(weixinConfig.appid, weixinConfig.appsecret, function(callback) {
	// 传入一个获取全局token的方法
	redisUtil.client().get(weixinConfig.weixinAccessTokenPrefix, function(err, reply) {
		logger.info('获取全局AccessToken: ', reply);
		if (err) {
			return logger.error(err);
		}
		callback(null, reply);
	});
}, function(token, callback) {
	// 请将token存储到全局，跨进程、跨机器级别的全局，比如写到数据库、redis等
	// 这样才能在cluster模式及多机情况下使用，以下为写入到文件的示例
	logger.info('缓存全局AccessToken', token);
	if (token.accessToken) {
		redisUtil.client().setex(weixinConfig.weixinAccessTokenPrefix, weixinConfig.weixinExpireTime, token.accessToken);
        request.post('https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=ACCESS_TOKEN&type=jsapi', {form: {access_token: token.accessToken, type: 'jsapi'}}, function (err, rsp, body) {
            if (err) {
                logger.error(err);
                return;
            }
            if(JSON.parse(body).errcode){
                logger.error("weixin api getticket error : %s", JSON.parse(body).errmsg);
                return;
            }
            var ticket = JSON.parse(body).ticket;
            logger.info('缓存全局ticket', ticket);
            if (ticket) {
                redisUtil.client().setex(weixinConfig.weixinTicketPrefix, weixinConfig.weixinExpireTime, ticket);
            }
        });
    }
	callback();
});

wechatApi.createMenu(menu.wx_menu, function(err, results) {
	logger.info('-------------创建菜单-------------');
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
        maxAge: 7000000
    },
    resave: false,
    saveUninitialized: true,
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