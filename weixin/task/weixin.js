var request = require('request');
var schedule = require('node-schedule');
var redisUtil = require('../common/redisUtil');
var weixinConfig = require('../config/weixin');

exports.refresh= function () {
    var i = 1;
    var mission = function () {
        logger.info('----------------mission-----------------:%d', i++);
        request.post('https://api.weixin.qq.com/cgi-bin/token', {form: {grant_type: 'client_credential', appid: weixinConfig.appid, secret: weixinConfig.appsecret}}, function (err, rsp, body) {
            if (err) {
                logger.error(err);
                return;
            }
            if(JSON.parse(body).errcode){
                logger.error("weixin api access_token error : %s", JSON.parse(body).errmsg);
                return;
            }
            var accessToken = JSON.parse(body).access_token;
            logger.info('mission accessToken:', accessToken);
            if (accessToken) {
                redisUtil.client().setex(weixinConfig.weixinAccessTokenPrefix, weixinConfig.weixinExpireTime, accessToken);
                request.post('https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=ACCESS_TOKEN&type=jsapi', {form: {access_token: accessToken, type: 'jsapi'}}, function (err, rsp, body) {
                    if (err) {
                        logger.error(err);
                        return;
                    }
                    if(JSON.parse(body).errcode){
                        logger.error("weixin api ticket error : %s", JSON.parse(body).errmsg);
                        return;
                    }
                    var ticket = JSON.parse(body).ticket;
                    logger.info('mission ticket:', ticket);
                    if (ticket) {
                        redisUtil.client().setex(weixinConfig.weixinTicketPrefix, weixinConfig.weixinExpireTime, ticket);
                    }
                });
            }
        });
    };

    logger.info('自动刷新微信JSAPI、ACCESS_TOKEN票据,间隔时间1小时');
    var rule = new schedule.RecurrenceRule();
    rule.minute = 0;
    schedule.scheduleJob(rule, mission);
};
