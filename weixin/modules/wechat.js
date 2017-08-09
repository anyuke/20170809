var wechat = require('wechat');
var verifyInfo = { //验证信息
	token: 'weixin', // your wechat token
	appid: 'wx203bc5fc5c004105' // your wechat appid
};

function wechatText(message, req, res, next) {
	var input = (message.Content || '').trim();

	if (/你好/.test(input)) {
		res.reply('Hello world (•̀ロ•́)و✧ ~~');
	} else {
		res.reply('(¬_¬)ﾉ 听不懂啦');
	}
}

//处理文本消息
var handler = wechat(verifyInfo, wechat.text(wechatText));

module.exports = handler;