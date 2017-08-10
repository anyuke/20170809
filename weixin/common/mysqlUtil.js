var mysql = require('mysql');
var mysqlConfig = require('../config/mysql.js');
var pool = mysql.createPool(mysqlConfig);
module.exports = {
    getConnection: function (callback) {
        if (pool === null) {
            pool = mysql.createPool(mysqlConfig);
        }
        pool.getConnection(function (err, conn) {
            callback(err, conn);
        });
    },
    execute: function (sql, params, callback) {
        if (pool === null) {
            pool = mysql.createPool(mysqlConfig);
        }
        pool.getConnection(function (err, coon) {
            if (err) {
                if (callback) {
                    return callback(err, null);
                }
                return false;
            }
            coon.query(sql, params, function (err, results) {
                coon.release();
                if (callback) {
                    return callback(err, results);
                }
                return results;
            });
        });
    },

    executeArray: function (sqls, params, callback) {
        if (pool === null) {
            pool = mysql.createPool(mysqlConfig);
        }
        pool.getConnection(function (err, coon) {
            if (err) {
                if (callback) {
                    return callback(err, []);
                }
                return false;
            }

            (function (idx, results) {
                function next(err, result) {
                    if (err) {
                        coon.release();
                        callback(err, []);
                        return;
                    }

                    idx++;

                    if(idx >= 1){
                        results.push(result);
                    }

                    if (idx >= sqls.length) {
                        coon.release();
                        callback(null, results);
                        return;
                    }
                    var sql = sqls[idx];
                    var param = params[idx];
                    logger.debug("sql :%s, param:%j", sql, param);
                    coon.query(sql, param, next);
                }
                next();
            })(-1, []);
        });
    },

    query_page:function(sql, from_idx, to_idx, params, callback){
        if (pool === null) {
            pool = mysql.createPool(mysqlConfig);
        }
        pool.getConnection(function (err, coon) {
            if (err) {
                if (callback) {
                    return callback(err, null);
                }
                return false;
            }
            var sql_count = "select count(1) as cnt from (" + sql + ")tab_page";
            coon.query(sql_count, params, function (err, results1) {
                if(err){
                    coon.release();
                    if(callback){
                        callback(err);
                    }
                    return;
                }

                var sql_page = sql + " limit " + from_idx + " , " + (to_idx - from_idx);
                coon.query(sql_page, params, function (err, results) {
                    coon.release();
                    if (callback) {
                        return callback(err, results, results1[0].cnt);
                    }
                    return;
                });
            });
        });
    },

    executeArraySafe: function (sqls, params, callback) {
        if (typeof (callback) != "function") {
            throw new Error("system error");
        }

        if (!(sqls instanceof Array) || !(params instanceof Array)) {
            callback(new Error("param error"));
            return;
        }

        if (pool === null) {
            pool = mysql.createPool(mysqlConfig);
        }
        pool.getConnection(function (err, coon) {
            if (err) {
                if (callback) {
                    return callback(err, []);
                }
                return false;
            }

            coon.beginTransaction(function (err) {
                if (err) {
                    logger.error(err);
                    coon.release();
                    return callback(err, []);
                }
                (function (idx, results) {
                    function next(err, result) {
                        if (err) {
                            logger.error(err);
                            coon.rollback();
                            coon.release();
                            callback(err, results);
                            return;
                        }

                        idx++;

                        if (idx >= 1) {
                            results.push(result);
                        }

                        if (idx >= sqls.length) {
                            coon.commit(function (err) {
                                if (err) {
                                    logger.error(err);
                                    coon.rollback();
                                    coon.release();
                                    callback(err, results);
                                    return;
                                }
                                coon.release();
                                callback(null, results);
                                return;
                            });
                            return;
                        }
                        var sql = sqls[idx];
                        var param = params[idx];
                        logger.debug("sql :%s, param:%j", sql, param);
                        coon.query(sql, param, next);
                    }
                    next();
                })(-1, []);
            });
        });
    },

    /* eachCallback 格式(resultInfo, next) , next格式next(err)
        resultInfo成员：sqls, params, index, result
            resultIndex 从0开始
    */
    executeArraySafe2: function (sqls, params, eachCallback, callback) {
        if (typeof (callback) != "function") {
            throw new Error("system error");
        }

        if (!(sqls instanceof Array) || !(params instanceof Array)) {
            callback(new Error("param error"));
            return;
        }

        if (pool === null) {
            pool = mysql.createPool(mysqlConfig);
        }
        pool.getConnection(function (err, coon) {
            if (err) {
                if (callback) {
                    return callback(err, []);
                }
                return false;
            }

            coon.beginTransaction(function (err) {
                if (err) {
                    logger.error(err);
                    coon.release();
                    return callback(err, []);
                }
                (function (idx, results) {
                    function next(err, result) {
                        if (err) {
                            logger.error(err);
                            coon.rollback();
                            coon.release();
                            callback(err, results);
                            return;
                        }

                        idx++;

                        if (idx >= 1) {
                            results.push(result);
                        }

                        if (idx >= sqls.length) {
                            coon.commit(function (err) {
                                if (err) {
                                    logger.error(err);
                                    coon.rollback();
                                    coon.release();
                                    callback(err, results);
                                    return;
                                }
                                coon.release();
                                callback(null, results);
                                return;
                            });
                            return;
                        }
                        var sql = sqls[idx];
                        var param = params[idx];
                        logger.debug("sql :%s, param:%j", sql, param);
                        coon.query(sql, param, function (err, result) {
                            if (err) {
                                next(err);
                                return;
                            }
                            eachCallback({
                                index: idx,
                                sqls: sqls,
                                params: params,
                                result: result
                            }, function (err) {
                                if (err) {
                                    next(err);
                                    return;
                                }
                                next(null, result);
                            });
                        });
                    }
                    next();
                })(-1, []);
            });
        });
    }
};