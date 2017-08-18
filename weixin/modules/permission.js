// add by adolf 2017/07/03

var config = require('../config/index');
var util_new = require("../common/utils");
var async = require("async");
require("../common/CONST");


// 添加职位
function fn_add(req, res) {
    var name = req.body.name;
    var check_params = [
        {type: "string", value: name, not_null: true, no_blank: true}
    ];
    if (!util_new.param_check(check_params)) {
        return utils.response(res, message.PARAMS_MISSING);
    }
    var sql = "insert into tb_position(name,state,createTime,updateTime)" +
        " values (?,1,?,?) ";
    var nowTime = Date.now();
    var params = [name, nowTime, nowTime];
    mysqlUtil.execute(sql, params, function(err, result) {
        if (err) {
            logger.error(err);
            return utils.response(res, message.SYSTEM_ERROR);
        }
        return utils.response(res, {code: 0, message: "success"});
    });
}

function fn_position_all(req, res) {

    var sql = "select id, name from tb_position where state = 1 ";
    mysqlUtil.execute(sql, [], function (err, result) {
        if (err) {
            logger.error(err);
            return utils.response(res, message.SYSTEM_ERROR);
        }
        result.push({
            id: SUPER_USER_POS_ID,
            name: SUPER_USER_NAME
        });
        return utils.response(res, { code: 0, message: "success", data: {list: result } });
    });
}

// 职位列表
function fn_list(req, res) {
    var pageNum = req.query.pageNum || 10;
    var index = req.query.index;
    var name = req.query.name;
    pageNum = parseInt(pageNum);
    index = parseInt(index);

    var check_params = [
        {type: "string", value: name, no_blank: true},
        {type: "number", value: pageNum, not_null: true},
        {type: "number", value: index, not_null: true}
    ];
    if (!util_new.param_check(check_params)) {
        return utils.response(res, message.PARAMS_MISSING);
    }

    var sql = "select id, name from tb_position where state = 1 ";
    var from_idx = (index - 1) * pageNum;
    var to_idx = from_idx + pageNum;
    var params = [];
    if (name) {
        sql += " and name like ? ";
        params.push(name);
    }
    mysqlUtil.query_page(sql, from_idx, to_idx, params, function(err, result, count) {
        if (err) {
            logger.error(err);
            return utils.response(res, message.SYSTEM_ERROR);
        }
        return utils.response(res, {code: 0, message: "success", data: {count: count, list: result}});
    });
}

// 职位权限信息
function fn_detail(req, res) {
    var id = req.query.id;
    var check_params = [
        {type: "number", value: id, not_null: true}
    ];
    if (!util_new.param_check(check_params)) {
        return utils.response(res, message.PARAMS_MISSING);
    }
    var sql = " select " +
        " t1.id as authid1, " +
        " t1. name as authname1, " +
        " t2.id as authid2, " +
        " t2. name as authname2, " +
        " t3.id as authid3, " +
        " t3. name as authname3, " +
        " t.authid as settingid " +
        " from " +
        " tb_auth t1 " +
        " inner join tb_sub_auth t2 on t2.upper_id = t1.id " +
        " inner join tb_thrid_auth t3 on t3.upper_id = t2.id " +
        " left join tb_position_auth t on t.authid = t3.id " +
        " and t.positionid =  " + id +
        " where " +
        " t1.state = 1 " +
        " and t2.state = 1 " +
        " and t3.state = 1 " +
        " order by t1.id asc, t2.id asc, t3.id asc ";
    mysqlUtil.execute(sql, [], function(err, result) {
        if (err) {
            logger.error(err);
            return utils.response(res, message.SYSTEM_ERROR);
        }
        var data = {};
        var authList = [];
        for (var i = 0; i < result.length; i++) {
            var row = result[i];
            var authList_sub1 = [];
            var authList_sub2 = [];
            var len = authList.length;
            var push1 = false;
            var push2 = false;
            if (len == 0 || authList[len - 1].id != row.authid1) {
                push1 = true;
            } else {
                authList_sub1 = authList[len - 1].authList;
            }

            len = authList_sub1.length;
            if (len == 0 || authList_sub1[len - 1].id != row.authid2) {
                push2 = true;
            } else {
                authList_sub2 = authList_sub1[len - 1].authList;
            }

            authList_sub2.push({
                id: row.authid3,
                name: row.authname3,
                selected: row.settingid == row.authid3 ? true : false
            });

            if (push2) {
                authList_sub1.push({
                    id: row.authid2,
                    name: row.authname2,
                    authList: authList_sub2
                });
            }

            if (push1) {
                authList.push({
                    id: row.authid1,
                    name: row.authname1,
                    authList: authList_sub1
                });
            }
        }

        for (var i = 0; i < authList.length; i++) {
            var selected = false;
            var obj = authList[i]; // obj һ��
            for (var j = 0; j < obj.authList.length; j++) {
                var selected2 = false;
                var sub_obj = obj.authList[j];  // sub_obj ����
                for (var k = 0; k < sub_obj.authList.length; k++) {
                    if (sub_obj.authList[k].selected) {
                        selected2 = true;
                        break;
                    }
                }
                sub_obj.selected = selected2;
                if (selected2) {
                    selected = true;
                }
            }
            authList[i].selected = selected;
        }
        data.authList = authList;
        return utils.response(res, {code: 0, message: "success", data: data});
    });
}

// 修改职位名称
function fn_name_update(req, res) {
    var id = req.body.id;
    var name = req.body.name;

    var check_params = [
        {type: "number", value: id, not_null: true},
        {type: "string", value: name, not_null: true, no_blank: true}
    ];
    if (!util_new.param_check(check_params)) {
        return utils.response(res, message.PARAMS_MISSING);
    }

    var sql = " update tb_position set name = ? where id = ? ";
    var params = [name, id];
    mysqlUtil.execute(sql, params, function(err, result) {
        if (err) {
            logger.error(err);
            return utils.response(res, message.SYSTEM_ERROR);
        }

        return utils.response(res, message.SUCCESS);
    });
}

// 修改职位权限
function fn_detail_update(req, res) {
    var authList = req.body.authList;
    var id = req.body.id;

    var check_params = [
        {type: "number", value: id, not_null: true}
    ];
    if (!util_new.param_check(check_params)) {
        return utils.response(res, message.PARAMS_MISSING);
    }
    if (typeof (authList) == "string") {
        authList = req.body.authList = req.body.authList.split(",");
    }

    if (!(authList instanceof Array )) {
        return utils.response(res, message.PARAMS_MISSING);
    }

    for (var i = 0; i < authList.length; i++) {
        if (!util_new.number_check(authList[i])) {
            return utils.response(res, message.PARAMS_MISSING);
        }
    }

    async.waterfall([
        function(cb) {
            logger.info("step 1 start");
            var sql = " select t.authId from tb_position_auth t where t.positionId = ? and t.authId in (" +
                req.body.authList.join(",") + ") ";
            var params = [req.body.id];
            mysqlUtil.execute(sql, params, cb);
        },
        function(result, cb) {
            logger.info("step 2 start");
            req.authMap = {};
            if (result && result.length > 0) {
                for (var i = 0; i < result.length; i++) {
                    req.authMap[result[i].authId] = true;
                }
            }
            var sql = "delete from tb_position_auth  where positionId = ? and authId not in (" +
                req.body.authList.join(",") + ")";
            var params = [req.body.id];
            mysqlUtil.execute(sql, params, cb);
        },
        function(result, cb) {
            logger.info("step 3 start");
            var values = [];
            var createTime = Date.now();
            
            for (var i = 0; i < req.body.authList.length; i++) {
                var authId = parseInt(req.body.authList[i]);
                if (!req.authMap[authId]) {
                    values.push([req.body.id, authId, createTime]);
                }
            }
            delete req.authMap;
            //delete req.body.authList;
            if (values.length == 0) {
                cb();
                return;
            }
            async.forEachSeries(values, function (value, cb) {
                var sql = "insert into tb_position_auth(positionId,authId,createTime) values (?,?,?)";
                mysqlUtil.execute(sql, value, cb);
            }, cb);
            //var sql = "insert into tb_position_auth(positionId,authId,createTime) values ?";
            //mysqlUtil.execute(sql, values, cb);
        }
    ], function(err) {
        if (err) {
            logger.error(err);
            return utils.response(res, message.SYSTEM_ERROR);
        }
        var authMap = {};
        for (var i = 0; i < req.body.authList.length; i++) {
            var key = "" + req.body.authList[i];
            authMap[key] = true;
        }
        modules.login.updateRedisRole(parseInt(req.body.id), authMap);
        return utils.response(res, message.SUCCESS);
    });
}

// 删除职位
function fn_del(req, res) {
    var check_params = [
        {type: "number", value: req.body.id, not_null: true}
    ];
    if (!util_new.param_check(check_params)) {
        return utils.response(res, message.PARAMS_MISSING);
    }
    req.body.id = parseInt(req.body.id);
    async.waterfall([
        function(cb) {
            var sql = "select count(1) as cnt from tb_cms_user t where t.role = ?";
            var params = [req.body.id];
            mysqlUtil.execute(sql, params, cb);
        },
        function(result, cb) {
            var cnt = result[0].cnt;
            if (cnt > 0) {
                utils.response(res, {code: -1, message: "职位正在使用，无法删除"});
                return;
            }
            var sql = "delete from tb_position_auth where positionId = ?";
            var params = [req.body.id];
            mysqlUtil.execute(sql, params, cb);
        },
        function(result, cb) {
            var sql = "update tb_position set state = 0 where id = ?";
            var params = [req.body.id];
            mysqlUtil.execute(sql, params, cb);
        }
    ], function(err) {
        if (err) {
            logger.error(err);
            return utils.response(res, message.SYSTEM_ERROR);
        }
        modules.login.removeRedisRole(req.body.id);
        return utils.response(res, message.SUCCESS);
    });
}

// 添加用户
function fn_user_add(req, res) {
    var check_params = [
        {type: "string", value: req.body.name, not_null: true, no_blank: true},
        {type: "number", value: req.body.phone, not_null: true},
        {type: "number", value: req.body.sex, not_null: true},
        {type: "number", value: req.body.positionId, not_null: true},
        {type: "string", value: req.body.pwd, not_null: true, no_blank: true}
    ];
    if (!util_new.param_check(check_params)) {
        return utils.response(res, message.PARAMS_MISSING);
    }
    async.waterfall([
        function(cb) {
            var sql = "select count(1) as cnt from tb_cms_user t where t.mobileNum = ?";
            var params = [req.body.phone];
            mysqlUtil.execute(sql, params, cb);
        },
        function(result, cb) {
            var cnt = result[0].cnt;
            if (cnt > 0) {
                utils.response(res, {code: -1, message: "手机号码已存在"});
                return;
            }
            var sql = "insert into tb_cms_user set ?";
            var params = {
                mobileNum: req.body.phone,
                password: req.body.pwd,
                sex: req.body.sex,
                name: req.body.name,
                role: req.body.positionId,
                createTime: new Date().getTime(),
                updateTime: new Date().getTime()
            };
            mysqlUtil.execute(sql, params, cb);
        }
    ], function(err) {
        if (err) {
            logger.error(err);
            return utils.response(res, message.SYSTEM_ERROR);
        }
        return utils.response(res, message.SUCCESS);
    });
}

// 用户列表
function fn_user_list(req, res) {
    var pageNum = req.query.pageNum || 10;
    var index = req.query.index;
    var telphone = req.query.telphone;
    var name = req.query.name;
    pageNum = parseInt(pageNum);
    index = parseInt(index);

    var check_params = [
        {type: "number", value: name, no_blank: true},
        {type: "number", value: telphone},
        {type: "number", value: pageNum, not_null: true},
        {type: "number", value: index, not_null: true}
    ];
    if (!util_new.param_check(check_params)) {
        return utils.response(res, message.PARAMS_MISSING);
    }

    var sql = " select t.id,t.sex, " +
        " t.name,t.password, " +
        " t.mobileNum as phone, " +
        " t.role as positionId, " +
        " t2.name as positionName " +
        "   from tb_cms_user t " +
        " left join tb_position t2 " +
        " on t.role = t2.id " +
        " where 1 =1  ";
    var from_idx = (index - 1) * pageNum;
    var to_idx = from_idx + pageNum;
    var params = [];
    if (telphone) {
        sql += " and t.mobileNum like ? ";
        params.push(telphone);
    }
    if (name) {
        sql += " and t.name like ? ";
        params.push(name);
    }

    mysqlUtil.query_page(sql, from_idx, to_idx, params, function(err, result, count) {
        if (err) {
            logger.error(err);
            return utils.response(res, message.SYSTEM_ERROR);
        }
        for (var i = 0; i < result.length; i++) {
            if (result[i].positionId == SUPER_USER_POS_ID) {
                result[i].positionName = SUPER_USER_NAME;
            }
        }
        return utils.response(res, {code: 0, message: "success", data: {count: count, list: result}});
    });
}

// 修改用户
function fn_user_edit(req, res) {
    var id = req.body.userId;
    var name = req.body.name;
    var phone = req.body.phone;
    var positionId = req.body.positionId;
    var pwd = req.body.pwd;
    var sex = req.body.sex;
    positionId = parseInt(positionId);

    var check_params = [
        {type: "number", value: id, not_null: true},
        {type: "string", value: name, not_null: true, no_blank: true},
        {type: "number", value: phone, not_null: true},
        {type: "number", value: positionId, not_null: true},
        {type: "string", value: pwd, not_null: true, no_blank: true},
        {type: "number", value: sex, not_null: true},
    ];
    if (!util_new.param_check(check_params)) {
        return utils.response(res, message.PARAMS_MISSING);
    }

    async.waterfall([
        function(cb) {
            var sql = "select count(1) as cnt from tb_cms_user t where t.mobileNum = ? and t.id != ?";
            var params = [req.body.phone, req.body.userId];
            var sql2 = "select role from tb_cms_user where id = ?";
            mysqlUtil.executeArray([sql, sql2], [params, [req.body.userId]], cb);
        },
        function (result, cb) {
            var roleInfo = result[1];
            result = result[0];
            var cnt = result[0].cnt;
            if (cnt > 0) {
                utils.response(res, {code: -1, message: "手机号码已存在"});
                return;
            }
            if (roleInfo.length == 0) {
                utils.response(res, { code: -1, message: "用户不存在" });
                return;
            }
            req.body.roleIdOld = roleInfo[0].role;
            var sql = " update tb_cms_user set ? where id = ? ";
            var params = [{
                updateTime: Date.now(),
                mobileNum: req.body.phone,
                password: req.body.pwd,
                name: req.body.name,
                sex: req.body.sex,
                role: req.body.positionId
            }, id];
            mysqlUtil.execute(sql, params, cb);
        }
    ], function(err) {
        if (err) {
            logger.error(err);
            return utils.response(res, message.SYSTEM_ERROR);
        }
        if (req.body.roleIdOld != parseInt(req.body.positionId)) {
            modules.login.kickCMSUser(req.body.userId);
        }
        return utils.response(res, message.SUCCESS);
    });
}

// 删除用户
function fn_user_del(req, res) {
    var userId = req.body.userId;

    var check_params = [
        {type: "number", value: userId, not_null: true}
    ];
    if (!util_new.param_check(check_params)) {
        return utils.response(res, message.PARAMS_MISSING);
    }

    var sql = "delete from  tb_cms_user where id = ?";
    var params = [userId];
    mysqlUtil.execute(sql, params, function(err, result) {
        if (err) {
            logger.error(err);
            return utils.response(res, message.SYSTEM_ERROR);
        }
        modules.login.kickCMSUser(req.body.userId);
        return utils.response(res, message.SUCCESS);
    });
}

module.exports = {
    add: fn_add,
    list: fn_list,
    detail: fn_detail,
    name_update: fn_name_update,
    detail_update: fn_detail_update,
    del: fn_del,
    user_add: fn_user_add,
    user_list: fn_user_list,
    user_edit: fn_user_edit,
    user_del: fn_user_del,
    position_all: fn_position_all
};