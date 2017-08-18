var xml2js = require('xml2js');
var md5 = require('md5');
var moment = require("moment");
var uuid = require('node-uuid'); 
const crypto = require("crypto");

exports.buildXML = function(json){
    var builder = new xml2js.Builder();
    return builder.buildObject(json);
};

exports.parseXML = function(xml, fn){
    var parser = new xml2js.Parser({ trim:true, explicitArray:false, explicitRoot:false });
    parser.parseString(xml, fn||function(err, result){});
};

exports.parseRaw = function(){
    return function(req, res, next){
        var buffer = [];
        req.on('data', function(trunk){
            buffer.push(trunk);
        });
        req.on('end', function(){
            req.rawbody = Buffer.concat(buffer).toString('utf8');
            next();
        });
        req.on('error', function(err){
            next(err);
        });
    }
};

exports.pipe = function(stream, fn){
    var buffers = [];
    stream.on('data', function (trunk) {
        buffers.push(trunk);
    });
    stream.on('end', function () {
        fn(null, Buffer.concat(buffers));
    });
    stream.once('error', fn);
};

exports.mix = function(){
    var root = arguments[0];
    if (arguments.length==1) { return root; }
    for (var i=1; i<arguments.length; i++) {
        for(var k in arguments[i]) {
            root[k] = arguments[i][k];
        }
    }
    return root;
};

exports.generateNonceString = function(length){
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var maxPos = chars.length;
    var noceStr = "";
    for (var i = 0; i < (length || 32); i++) {
        noceStr += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return noceStr;
};

/**
 * @Author:      
 * @DateTime:    2016-06-17 19:31:17
 * @Api_Name:    weixin_getSign
 * @Parameters:  Object key
 * @Description: 通过传递包含所有请求参数的对象，获取到微信请求签名，自动忽略空参数和sign本身
 *              微信接口  签名算法 获取 sign
 *              第一步，设所有发送或者接收到的数据为集合M，将集合M内非空参数值的参数按照参数名ASCII码从小到大排序（字典序），使用URL键值对的格式（即key1=value1&key2=value2…）拼接成字符串stringA
 *              第二步，在stringA最后拼接上key得到stringSignTemp字符串，并对stringSignTemp进行MD5运算，再将得到的字符串所有字符转换为大写，得到sign值signValue
 */

 exports.weixin_getSign = function (object, key) {
    var stringA = [];
    for(var item in object){
        if( object[item] != '' 
            && item.indexOf('sign') == -1) {//不拼接空字段，key在MD5前拼接，sign字段最后拼接
            stringA.push(item+'='+object[item]+'&');
        }
    }
    stringA = stringA.sort( function (a,b) { return a>b?1:-1;}).join('');//从小到大
    stringSignTemp=stringA+'key='+key;
    return md5(stringSignTemp).toUpperCase();
 }

 /**
  * @Author:      
  * @DateTime:    2016-06-17 21:31:30
  * @Api_Name:    weixin_buildXML 
  * @Parameters:  Path 
  * @Description: build XML 
  */
 exports.weixin_buildXML = function (data) {
    var ret = "<xml>";
    for(var k in data)
    {
        ret += "<" + k + "><![CDATA[" + data[k] + "]]></" + k + ">";
    }
    ret += "</xml>";
    return ret;
}

/**
 * @Author:      
 * @DateTime:    2016-06-20 09:21:54
 * @Api_Name:    weixin_parseOrder
 * @Parameters:  body(string) 
 * @Description: 解析获取的订单信息，按照对象的格式保存 
 */
exports.weixin_parseOrder = function (body) {
    var temp = body.split(/[\r\n]/g);
    var obj = [];
    var column_title;//列名
    var result = [];
    for(var item in temp) {
        if(temp[item]!='') {
            obj.push(temp[item].split(','));
        }
    }
    column_title = obj[0];
    for(var item in obj){//行遍历
        var row = {};
        if(obj[item][0].indexOf('`') != -1) {//不包含`则应为标题行,应为总结信息，不处理入结果
            for (var i = 0; i < column_title.length; i++){
                row[column_title[i]] = obj[item][i].replace(/`/,'');
            }
            result.push(row);
        }
        else{
            column_title = obj[item];
        }
    }
    return result;
}

/**
 * @Author:      
 * @DateTime:    2016-06-23 21:54:52
 * @Api_Name:    weixin_parseObject 
 * @Api_Path:    Path 
 * @Description: 转化对象数组为数组数组，为导入excel做准备 
 */
 exports.weixin_parseObject = function (objs, res){
    var id = 1;
    //console.log(objs);
    objs.forEach(function (obj){
        var arr = [];
        arr.push(id++);
        for(var item in obj){
            arr.push(obj[item]);
        }
        //console.log(obj);
        //console.log(arr);
        res.push(arr);
    })
    return res;
 }
/**
 * @Author:      
 * @DateTime:    2016-06-23 18:17:53
 * @Api_Name:    Name 
 * @Api_Path:    Path 
 * @Description: Description 
 */
 exports.getNextDay = function (d){
    d = new Date(d);
    d = +d + 1000*60*60*24;
    d = new Date(d);
    //return d;
    //格式化
    return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();       
}

exports.empty_str = function(str)
{
    if(null == str)
    {
        return true;
    }
    if(str.length == 0)
    {
        return true;
    }
    return false;
}

exports.not_empty = function(value)
{
    if(null == value)
    {
        return false;
    }
    if(typeof(value) == "string" && value.length == 0)
    {
        return false;
    }
    return true;
}

exports.is_number = function(value)
{
    if(null == value){
        return false;
    }
    if(typeof(value) == "number"){
        return true;
    }
    return false;
}

exports.get_utc_todate_sql = function(value)
{
    if(null == value){
        return null;
    }
    if(typeof(value) == "string"){
        value = parseInt(value);
    }
    else if(typeof(value) == "number"){
    }
    else{
        return null;
    }
    var time_str = moment(value).format("YYYY-MM-DD HH:mm:ss");
    //to_date('2005-01-01 13:14:20','yyyy-MM-dd HH24:mi:ss')
    
    var str = " to_date('" + time_str + "','yyyy-MM-dd HH24:mi:ss') ";
    
    return str;
}


exports.copyObj =function (fromObj){
    var toObj = {};
    for(var i in fromObj){   
        toObj[i] = fromObj[i];
    }
    return toObj;
}

exports.weixin_getSHA1Sign = function(object)
{
    var stringA = [];
    var shasum = crypto.createHash('sha1');
    for(var item in object){
        stringA.push(item+'='+object[item]);
    }
    stringA = stringA.sort( function (a,b) { return a>b?1:-1;}).join('&');//从小到大
    shasum.update(stringA);
    return shasum.digest('hex');
}


exports.generateCodeString = function(length){
    var chars = '0123456789';
    var maxPos = chars.length;
    var noceStr = "";
    for (var i = 0; i < (length || 32); i++) {
        noceStr += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return noceStr;
};

exports.randomInt = function(from, to){
    var len = to - from;
    var ret = Math.floor(Math.random() * len);
    return from + ret;
};

exports.number_to_string = function (num, fixedLen) {
    var tmpCid = "" + num;
    var len = tmpCid.length;
    if (len < fixedLen) {
        for (var i = 0; i < (fixedLen - len); i++) {
            tmpCid = "0" + tmpCid;
        }
    }
    else if (tmpCid.length > fixedLen) {
        tmpCid = tmpCid.substring(0, fixedLen);
    }
    return tmpCid;
}


// array1 字符串数组 array2数字数组
exports.contains = function (array1, array2) {
    var mp1 = {};
    for (var i = 0; i < array1.length; i++) {
        mp1["" + array1[i]] = true;
    }

    for (var i = 0; i < array2.length; i++) {
        var val = "" + array2[i];
        if (true != mp1[val]) {
            return false;
        }
    }
    return true;
}


exports.removeAtIdx = function (array, idx) {
    var ret = [];
    for (var i = 0; i < array.length; i++){
        if (idx == i) {
        } else {
            ret.push(array[i]);
            j++;
        }
    }
    return ret;
}

exports.getquerystring = function (query) {
    var first = true;
    var ret = "?";
    for (key in query) {
        if (first) {
            ret += key + "=" + encodeURIComponent(query[key]);
            first = false;
        }
        else {
            ret += "&" + key + "=" + encodeURIComponent(query[key]);
        }
    }
    if (first) {
        return "";
    }
    return ret;
}

var s_num_reg = new RegExp("^[0-9]{1,}$");
exports.number_check = function (val) {
    // 查询是否是数字
    return s_num_reg.test(val);
}

function number_check(val) {
    // 查询是否是数字
    return s_num_reg.test(val);
}

exports.str_noempty_check = function (val) {
    // 查询是否有空格 ，有空格返回假
    if (!val) {
        return true;
    }
    if (typeof (val) != "string") {
        return false;
    }
    var ret = val.indexOf(" ");
    if (ret == -1) {
        return true;
    }
    return false;
}

//var time_fmt_reg = /^([0-9]{4}-[0-9]{1,2}-[0-9]{2} [0-9]{2}:[0-9]{2}[:]{0,1}[0-9]{0,2})$/;
var time_fmt_reg = /^([0-9]{4}[-/][0-9]{1,2}[-/][0-9]{2} [0-9]{2}:[0-9]{2}[:]{0,1}[0-9]{0,2})$/;
exports.time_fmt_check = function (val) {
    // 时间格式 yyyy-mm-dd hh:mi:ss yyyy/mm/dd hh:mi:ss
    return time_fmt_reg.test(val);
}

var time_fmt_reg2 = /^([0-9]{8} [0-9]{2}:[0-9]{2}[:]{0,1}[0-9]{0,2})$/;
exports.time_fmt_check2 = function (val) {
    // 时间格式 yyymmdd hh:mi:ss
    return time_fmt_reg2.test(val);
}

var time_fmt_reg3 = /^([0-9]{4}-[0-9]{2}-[0-9]{2})$/;
exports.time_fmt_check3 = function (val) {
    // 时间格式 yyy-mm-dd
    return time_fmt_reg3.test(val);
}


exports.body_to_json = function (body) {
    var ret = {};
    if (body.length == 0) {
        return ret;
    }
    var array = body.split("&");
    for (var i = 0; i < array.length; i++) {
        var str = array[i];
        str = str.split("=");
        ret[str[0]] = decodeURIComponent(str[1]);
    }
    return ret;
}

function trimStr(str){return str.replace(/(^\s*)|(\s*$)/g,"");}

exports.get_req_ip = function (req) {
    if (!req || !req.headers) {
        console.error("util.get_req_ip error ! req is null or headers is null");
        return "127.0.0.1";
    }
    var ip = req.headers["x-forwarded-for"];
    if (ip && ip.length > 0 && "unknown" != ip.toLowerCase() && typeof(ip) == 'string') {
        return trimStr(ip.split(",")[0]);
    }
    ip = req.headers["Proxy-Client-IP"];
    if (ip && ip.length > 0 && "unknown" != ip.toLowerCase() && typeof(ip) == 'string') {
        return trimStr(ip.split(",")[0]);
    }
    ip = req.headers["WL-Proxy-Client-IP"];
    if (ip && ip.length > 0 && "unknown" != ip.toLowerCase() && typeof(ip) == 'string') {
        return trimStr(ip.split(",")[0]);
    }
    return req.ip;
 }

exports.get_uuid = function () {
    return uuid.v1().replace(/-/g, "");
};


// 参数检查
/*
string 字符串
number 整数
float 小数
date 日期

通用检查
    not_null 非空
string类参数检查
    no_blank 不能有空格
number类参数检查
    no_zero:不能为0
date类参数检查
    fmt: 2    yyyy-mm-dd
         1    yyyy-mm-dd hh:mm:ss
*/
exports.param_check = function (_param) {
    logger.info("_param：%j", _param);
    if (!_param) {
        return false;
    }
    for (var i = 0; i < _param.length; i++) {
        var row = _param[i];
        switch (row.type) {
            case 'string'://字符串
                if (row.not_null) {
                    if (!row.value) {
                        return false;
                    }
                    if (row.value.length == 0) {
                        return false;
                    }
                } else {
                    if (!row.value) {
                        continue;
                    }
                }
                if (typeof (row.value) != "string") {
                    return false;
                }
                if (row.no_blank) {
                    if (!this.str_noempty_check(row.value)) {
                        return false;
                    }
                }
                break;
            case 'number'://数字
                if (row.not_null) {
                    if (!this.number_check(row.value)) {
                        return false;
                    }
                }
                if (!row.value) {
                    continue;
                }
                if (!this.number_check(row.value)) {
                    return false;
                }
                if (row.in) {
                    if (row.in instanceof Array) {
                        var val = parseInt(row.value);
                        var find = false;
                        for (var k = 0; k < row.in.length; k++) {
                            if (row.in[k] == val) {
                                find = true;
                                break;
                            }
                        }
                        if (!find) {
                            return false;
                        }
                    }
                }
                break;
            case "float":
                if (row.not_null) {
                    if (isNaN(parseFloat(row.value))) {
                        return false;
                    }
                    continue;
                }
                if (!row.value) {
                    continue;
                }
                if (isNaN(parseFloat(row.value))) {
                    return false;
                }
                break;
            case 'date'://13位时间戳
                if (row.not_null) {
                    if (!this.time_fmt_check2(row.value)) {
                        return false;
                    }
                    continue;
                }
                if (!row.value) {
                    continue;
                }
                if (!this.time_fmt_check2(row.value)) {
                    return false;
                }
                break;
        }
    }

    return true;
}

exports.get_query_string = function (obj) {
    var first = true;
    var str = "";
    for (key in obj) {
        if (first) {
            first = false;
            str += key + "=" + encodeURIComponent(obj[key]);
        } else {
            str += "&" + key + "=" + encodeURIComponent(obj[key]);
        }
    }
    return str;
}

// 产生随机数字
exports.randomNumber = function (_idx){
    var str = '';
    for(var i = 0; i < _idx; i += 1){
        str += Math.floor(Math.random() * 10);
    }
    return str;
}


function forEachSeries(list, cb, callback) {
    (function (idx) {
        function next(err) {
            if (err) {
                callback(err);
                return;
            }
            idx++;
            if (idx >= list.length) {
                callback();
                return;
            }
            var item = list[idx];
            cb(item, next);
        }
        next();
    })(-1);
}

exports.forEachSeries = forEachSeries;


exports.getCheckSum = function (AppSecret ,Nonce ,CurTime){
    var stringA = AppSecret + Nonce + CurTime;
    var shasum = crypto.createHash('sha1');
    shasum.update(stringA);
    return shasum.digest('hex');
}

function valid_search_str(str) {
    if (null == str || undefined == str) {
        return true;
    }
    if (typeof (str) != "string") {
        return false;
    }
    var pattern = new RegExp("['\"%]{1,}");
    if (pattern.test(str)) {
        return false;
    }
    return true;
}

// 搜索字符串是否有效
exports.valid_search_str = valid_search_str;

// 检查数组元素是否有重复
function getRepeatItem(array) {
    if (array instanceof Array) {
    } else {
        throw new Error("系统异常");
    }
    var ret = [];
    var mp = {};
    for (var i = 0; i < array.length; i++) {
        var val = array[i];
        if (mp[val]) {
            ret.push(val);
        } else {
            mp[val] = true;
        }
    }
    delete mp;
    return ret;
}

exports.getRepeatItem = getRepeatItem;

exports.response = function (res, data) {
    res.send({code: data.code, message: data.message, env: env, data: data.data});
    logger.debug('[响应][' + utils.getClientIp(res.req) + ']', JSON.stringify({ code: data.code, message: data.message, env: env, data: data.data }));
};

exports.isValidMobileNum = function (obj) {
    return /^1[3|4|5|7|8][0-9]\d{8}$/.test(obj);
};

exports.isContains = function (arr, str) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == str)
            return true;
    }
    return false;
};