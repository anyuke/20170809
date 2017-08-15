var log4js = require('log4js');
var level = 'INFO';
var filePath = rootdir + '/logs';

log4js.configure({
	appenders: {
		ANYUKE_LOGGER: {
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
			appenders: ['ANYUKE_LOGGER'],
			level: 'info'
		}
	}
});

var logger = log4js.getLogger('ANYUKE_LOGGER');

module.exports = logger;