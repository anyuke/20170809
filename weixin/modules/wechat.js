var wechat = require('wechat');
var weixinConfig = require('../config/weixin.js');

var verifyInfo = { //验证信息
	token: weixinConfig.token, // your wechat token
	appid: weixinConfig.appid // your wechat appid
};

function wechatText(message, req, res, next) {
	var input = (message.Content || '').trim();

	if (/你好/.test(input)) {
		res.reply('Hello world (•̀ロ•́)و✧ ~~');
	} else if (/屌丝/.test(input)) {
		res.reply({
			content: '说谁呢~',
			type: 'text'
		});
	} else if (/音乐/.test(input)) {
		// 回复一段音乐
		res.reply({
			title: "来段音乐吧",
			description: "一无所有",
			musicUrl: "http://mp3.com/xx.mp3",
			hqMusicUrl: "http://mp3.com/xx.mp3",
			thumbMediaId: "thisThumbMediaId"
		});
	} else if (/高富帅/.test(input)) {
		// 回复高富帅(图文回复)
		res.reply([{
			title: '你来我家接我吧',
			description: '这是女神与高富帅之间的对话',
			picurl: 'https://ss0.bdstatic.com/94oJfD_bAAcT8t7mm9GUKT-xh_/timg?image&quality=100&size=b4000_4000&sec=1502284045&di=378538243b74294cdbd4eb61d2606e36&src=http://pic48.nipic.com/file/20140912/7487939_223919315000_2.jpg',
			url: 'http://nodeapi.cloudfoundry.com/'
		}]);
	} else {
		res.reply('(¬_¬)ﾉ 听不懂啦');
	}
}

//处理文本消息
var handler = wechat(verifyInfo, wechat.text(wechatText));

module.exports = {
	handler: handler
};