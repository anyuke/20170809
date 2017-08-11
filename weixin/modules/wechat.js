'use strict'

var wechat = require('wechat');
var sha1 = require('sha1');

//构建 WeChat 对象 即 js中 函数就是对象
var WeChat = function(config) {
	//设置 WeChat 对象属性 config
	this.config = config;

	//设置 WeChat 对象属性 token
	this.token = config.token;
};

function wechatText(message, req, res, next) {
	console.log('----------------step 3');
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

WeChat.prototype.auth = function(req, res) {
	//1.获取微信服务器Get请求的参数 signature、timestamp、nonce、echostr
	var signature = req.query.signature, //微信加密签名
		timestamp = req.query.timestamp, //时间戳
		nonce = req.query.nonce, //随机数
		echostr = req.query.echostr; //随机字符串

	//2.将token、timestamp、nonce三个参数进行字典序排序
	var array = [this.token, timestamp, nonce];
	array.sort();

	//3.将三个参数字符串拼接成一个字符串进行sha1加密
	var tempStr = array.join('');
	// const hashCode = crypto.createHash('sha1'); //创建加密类型 
	var resultCode = sha1(tempStr); //对传入的字符串进行加密

	//4.开发者获得加密后的字符串可与signature对比，标识该请求来源于微信
	if (resultCode === signature) {
		res.send(echostr);
	} else {
		res.send('mismatch');
	}
	// var verifyInfo = { //验证信息
	// 	token: this.token,
	// 	appid: this.config.appid
	// };
	// console.log('verifyInfo:\n', verifyInfo);
	// wechat(verifyInfo, wechat.text(wechatText));
};

//暴露可供外部访问的接口
module.exports = WeChat;