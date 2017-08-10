var redis = require('redis');
var redisConfig = require('../config/redis.js');
var redisClient = redis.createClient(redisConfig.port, redisConfig.host, redisConfig.opts);

module.exports = {
    client: function() {
        if (redisClient) {
            return redisClient;
        }
        redisClient = redis.createClient(redisConfig.port, redisConfig.host, redisConfig.opts);
        redisClient.on('error', function(err) {
            logger.error(err);
        });
        return redisClient;
    },

    setLock: function(resource, ttl, callback) {
        if (!resource || !ttl || !callback) {
            return callback('缺少参数', null);
        }
        var self = this;
        var value = new Date().getTime() + utils.createRandomStr(16);
        self.client().SET(resource, value, 'EX', ttl, 'NX', function(err, reply) {
            if (!err && reply === 'OK') {
                return callback(null, {resource: resource, value: value});
            }
            err = err || resource + '处于锁定状态';
            return callback(err, null);
        });
    },

    clearLock: function(lock) {
        if (!lock) {
            return;
        }
        var self = this;
        self.client().GET(lock.resource, function(err, reply) {
            if (reply === lock.value) {
                self.client().DEL(lock.resource);
            }
        });
    }
};