var log4js = require('log4js');
var level = 'INFO';
var filePath = rootdir + '/logs';

log4js.configure({
	appenders: {
		cheese: {
			type: 'dateFile',
			filename: filePath,
			pattern: '/yyyyMMdd.txt',
			absolute: true,
			alwaysIncludePattern: true,
			category: 'fileLog'
		}
	},
	categories: {
		default: {
			appenders: ['cheese'],
			level: 'info'
		}
	}
});

var logger = log4js.getLogger('cheese');

module.exports = logger;