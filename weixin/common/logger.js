var log4js = require('log4js');
var level = 'INFO';
var normalFilePath = rootdir + '/logs/normal';
var errorFilePath = rootdir + '/logs/error';

log4js.configure({
	appenders: {
		everything: {
			type: 'dateFile',
			filename: normalFilePath,
			pattern: '/yyyyMMdd.txt',
			absolute: true,
			alwaysIncludePattern: true,
			category: 'fileLog'
		},
		emergencies: {
			type: 'dateFile',
			filename: errorFilePath,
			pattern: '/yyyyMMdd.txt',
			absolute: true,
			alwaysIncludePattern: true,
			category: 'fileLog'
		},
		'just-errors': {
			type: 'logLevelFilter',
			appender: 'emergencies',
			level: 'error'
		},
		"email": {
			"type": "smtp",
			"subject": 'error logs',
			"recipients": "1249836965@qq.com", //邮件人邮箱， 如果有多个写成数组
			"sender": "liyunfei@jintaichangfeng.com", //发件人邮箱
			"sendInterval": 0, //邮件时间间隔
			"SMTP": { //邮件首发服务配置，这要参考相关邮箱配置， 以163邮箱为例
				"host": "smtp.exmail.qq.com", //邮件服务地址
				"port": 465,
				"auth": {
					"user": "liyunfei@jintaichangfeng.com", //邮箱地址
					"pass": "Lyf123456" //登入密码
				}
			},
			"attachment": {
				"enable" : true,
				"message" : 'See the attachment for the error logs',
				"filename" : 'error.log'
			}
		}
	},
	categories: {
		default: {
			appenders: ['just-errors', 'everything'],
			level: 'info'
		},
		email: {
			appenders: ['email'],
			level: 'error'
		}
	}
});

var logger = log4js.getLogger();
var emailLogger = log4js.getLogger('email')

exports.logger = logger;
exports.emailLogger = emailLogger; // 错误日志发送邮箱