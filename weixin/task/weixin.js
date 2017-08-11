var request = require('request');
var schedule = require('node-schedule');
var redisUtil = require('../common/redisUtil');
var weixinConfig = require('../config/weixin');

exports.refresh= function () {
    var mission = function () {
        request.post('https://api.weixin.qq.com/cgi-bin/token', {form: {grant_type: 'client_credential', appid: weixinConfig.appId, secret: weixinConfig.appSecret}}, function (err, rsp, body) {
            if (err) {
                console.error(err);
                return;
            }
            var accessToken = JSON.parse(body).access_token;
            if (accessToken) {
                redisUtil.client().setex(weixinConfig.weixinAccessTokenPrefix, weixinConfig.weixinExpireTime, accessToken);
                request.post('https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=ACCESS_TOKEN&type=jsapi', {form: {access_token: accessToken, type: 'jsapi'}}, function (err, rsp, body) {
                    var ticket = JSON.parse(body).ticket;
                    if (ticket) {
                        redisUtil.client().setex(weixinConfig.weixinTicketPrefix, weixinConfig.weixinExpireTime, ticket);
                    }
                });
            }
        });
    };

    mission();
    
    console.info('自动刷新微信JSAPI、ACCESS_TOKEN票据,间隔时间1小时');
    var rule = new schedule.RecurrenceRule();
    rule.minute = 0;
    schedule.scheduleJob(rule, mission);
};
