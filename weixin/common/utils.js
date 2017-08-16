var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var express = require('express');
var excelExport = require('excel-export');
var xlsx = require('node-xlsx');

module.exports = {
    dateFormat: function (date, format) {
        var millisecond = date.getMilliseconds();
        if (millisecond < 100) {
            millisecond = '0' + millisecond;
        }
        else if (millisecond < 10) {
            millisecond = '00' + millisecond;
        }
        var o = {
            'M+': date.getMonth() + 1,
            'd+': date.getDate(),
            'h+': date.getHours(),
            'm+': date.getMinutes(),
            's+': date.getSeconds(),
            'q+': Math.floor((date.getMonth() + 3) / 3),
            'S+': millisecond
        };
        if (/(y+)/.test(format)) {
            format = format.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
        }
        for (var k in o) {
            if (new RegExp('(' + k + ')').test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length));
            }
        }
        return format;
    },

    isArray: function (obj) {
        return Array.isArray(obj);
    },

    isBoolean: function (obj) {
        return typeof obj === 'boolean';
    },

    isNull: function (obj) {
        return obj === null;
    },

    isNullOrUndefined: function (obj) {
        return obj == null;
    },

    isNumber: function (obj) {
        return typeof obj === 'number';
    },

    isString: function (obj) {
        return typeof obj === 'string';
    },

    isValidMobileNum: function (obj) {
        return /^1[3|4|5|7|8][0-9]\d{8}$/.test(obj);
    },

    isValidIdentityNum: function (obj) {
        return /(^\d{15}$)|(^\d{17}([0-9]|X)$)/.test(obj);
    },

    isValidEmail: function (obj) {
        return /^(\w)+(\.\w+)*@(\w)+((\.\w{2,3}){1,3})$/.test(obj)
    },

    isSymbol: function (obj) {
        return typeof obj === 'symbol';
    },

    isUndefined: function (obj) {
        return obj === void 0;
    },

    isPrimitive: function (obj) {
        return obj === null || typeof obj === 'boolean' || typeof obj === 'number' || typeof obj === 'string' || typeof obj === 'symbol' || typeof obj === 'undefined';
    },

    isInteger: function (obj) {
        return typeof obj === 'number';
    },

    isEmptyObject: function (obj) {
        for (var key in obj) {
            return false
        }
        return true;
    },

    isStrNotEmpty: function (obj) {
        return typeof obj != 'undefined' && obj != null && obj.toString().replace(/^\s+|\s+$/g, '') != '';
    },

    isParamsNotEmpty: function (array) {
        for (var i in array) {
            if (!this.isStrNotEmpty(array[i])) {
                return false;
            }
        }
        return true;
    },

    isContains: function (arr, str) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] == str)
                return true;
        }
        return false;
    },

    stringFormat: function () {
        var args = [];
        var str = arguments[0];
        for (var i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        return str.replace(/\{(\d+)\}/g, function (s, i) {
            return args[i];
        });
    },

    getClientIp: function(req) {
        var ipAddress;
        var clientIp = req.headers['x-client-ip'];
        var forwardedForAlt = req.headers['x-forwarded-for'];
        var realIp = req.headers['x-real-ip'];
        var clusterClientIp = req.headers['x-cluster-client-ip'];
        var forwardedAlt = req.headers['x-forwarded'];
        var forwardedFor = req.headers['forwarded-for'];
        var forwarded = req.headers['forwarded'];
        if (clientIp) {
            ipAddress = clientIp;
        }
        else if (forwardedForAlt) {
            var forwardedIps = forwardedForAlt.split(',');
            ipAddress = forwardedIps[0];
        }
        else if (realIp) {
            ipAddress = realIp;
        }
        else if (clusterClientIp) {
            ipAddress = clusterClientIp;
        }
        else if (forwardedAlt) {
            ipAddress = forwardedAlt;
        }
        else if (forwardedFor) {
            ipAddress = forwardedFor;
        }
        else if (forwarded) {
            ipAddress = forwarded;
        }
        if (!ipAddress) {
            try {
                ipAddress = req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress || null;
            }
            catch (e) {
                ipAddress = null;
            }
        }
        return ipAddress;
    },

    getStrLength: function (str) {
        var len = 0;
        for (var i = 0; i < str.length; i++) {
            var c = str.charCodeAt(i);
            //单字节加1
            if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
                len++;
            }
            else {
                len += 2;
            }
        }
        return len;
    },

    arrayDistinct: function (srcArray) {
        var dstArray = [], isRepeated;
        for (var i = 0; i < srcArray.length; i++) {
            isRepeated = false;
            for (var j = 0; j < dstArray.length; j++) {
                if (srcArray[i] == dstArray[j]) {
                    isRepeated = true;
                    break;
                }
            }
            if (!isRepeated) {
                dstArray.push(srcArray[i]);
            }
        }
        return dstArray;
    },

    sleep: function (sleepTime) {
        for (var start = +new Date; +new Date - start <= sleepTime;) {
        }
    },

    //1. 去除空字符、sign、sign_type
    filter: function (obj) {
        var newobj = {};
        for (var key in obj) {
            if (key == 'sign' || obj[key] == '')
                continue;
            newobj[key] = obj[key];
        }
        return newobj;
    },

    //2. 升序排序
    sort: function (obj) {
        var newobj = {};
        var keys = [];
        var i, j, key;
        for (key in obj) {
            keys.push(key);
        }
        for (i = 0; i < keys.length; i++) {
            for (j = i + 1; j < keys.length; j++) {
                if (keys[i] > keys[j]) {
                    key = keys[i];
                    keys[i] = keys[j];
                    keys[j] = key;
                }
            }
        }
        for (i = 0; i < keys.length; i++) {
            key = keys[i];
            newobj[key] = obj[key];
        }
        return newobj;
    },

    //3.拼接字符串
    link: function (obj) {
        var str = '';
        for (var key in obj) {
            str += key + '=' + obj[key] + '&';
        }
        return str.substring(0, str.length - 1);
    },

    formatPubKey: function (pubKey) {
        var fKey = '-----BEGIN PUBLIC KEY-----\n';
        var len = pubKey.length;
        for (var i = 0; i < len;) {
            fKey = fKey + pubKey.substr(i, 64) + '\n';
            i += 64;
        }
        fKey += '-----END PUBLIC KEY-----';
        return fKey;
    },

    formatPriKey: function (priKey) {
        var fKey = '-----BEGIN RSA PRIVATE KEY-----\n';
        var len = priKey.length;
        for (var i = 0; i < len;) {
            fKey = fKey + priKey.substr(i, 64) + '\n';
            i += 64;
        }
        fKey += '-----END RSA PRIVATE KEY-----';
        return fKey;
    },

    sign: function (private_key, data, algorithm) {
        if (!algorithm) {
            algorithm = 'RSA-SHA256';
        }
        var signer = crypto.createSign(algorithm);
        signer.update(data, 'utf8');
        return signer.sign(this.formatPriKey(private_key), 'base64');
    },

    verify: function decipher(public_key, data, sign, algorithm) {
        if (!algorithm) {
            algorithm = 'RSA-SHA256';
        }
        var verify = crypto.createVerify(algorithm);
        verify.update(data, 'utf8');
        return verify.verify(this.formatPubKey(public_key), sign, 'base64');
    },

    readExcel: function (fullName) {
        return xlsx.parse(fullName);
    },

    /**
     * 单Sheet页
     * @param filePath 文件名(带路径)
     * @param data 数据
     * @param callback 回调函数
     */
    createExcel: function (filePath, data, callback) {
        var sheet = {
            cols: [{caption: '编号', type: 'number', width: 10}],
            rows: []
        };
        for (var key in data[0]) {
            sheet.cols.push({
                caption: key,
                type: typeof(data[0][key]),
                width: this.getStrLength(data[0][key] + '') > 12 ? this.getStrLength(data[0][key] + '') : 12
            });
        }
        for (var i in data) {
            sheet.rows[i] = [];
            sheet.rows[i][0] = parseInt(i) + 1;
            for (var j = 1; j < sheet.cols.length; j++) {
                sheet.rows[i][j] = data[i][sheet.cols[j].caption];
            }
        }
        var file = excelExport.execute(sheet);
        fs.writeFile(filePath, file, 'binary', function (err) {
            callback(err, filePath);
        });
    },

    /**
     * 多Sheet页
     * @param filePath 文件名(带路径)
     * @param list {name,data}
     * @param callback 回调函数
     */
    createExcelMulti: function (filePath, list, callback) {
        var sheets = [];
        for (var i = 0; i < list.length; i++) {
            var sheet = {
                name: list[i].name,
                data: []
            };
            var head = ['编号'];
            for (var key in list[i].data[0]) {
                head.push(key);
            }
            sheet.data.push(head);
            for (var j = 0; j < list[i].data.length; j++) {
                var row = [j + 1];
                for (var value in list[i].data[j]) {
                    row.push(list[i].data[j][value]);
                }
                sheet.data.push(row);
            }
            sheets.push(sheet);
        }
        var file = xlsx.build(sheets);
        fs.writeFile(filePath, file, 'binary', function (err) {
            callback(err, filePath);
        });
    },

    createRandomCode: function (length) {
        if (!length) {
            length = 6
        }
        var codeStr = '';
        var selectChar = '0123456789';
        for (var i = 0; i < length; i++) {
            var charIndex = Math.floor(Math.random() * selectChar.length);
            codeStr += selectChar[charIndex];
        }
        return codeStr;
    },

    createRandomStr: function (length) {
        if (!length) {
            length = 8
        }
        var randomStr = '';
        var selectChar = 'ABCDEFGHIJKLMNOPQRSTUVWXTZ0123456789abcdefghiklmnopqrstuvwxyz';
        for (var i = 0; i < length; i++) {
            var index = Math.floor(Math.random() * selectChar.length);
            randomStr += selectChar[index];
        }
        return randomStr;
    },

    createDirectory: function (fullPath) {
        if (fs.existsSync(fullPath)) {
            return true;
        } else {
            if (this.createDirectory(path.dirname(fullPath))) {
                fs.mkdirSync(fullPath);
                return true;
            }
        }
    },

    loadModules: function (path) {
        var modules = {};
        var work = function (path) {
            var files = fs.readdirSync(path);
            files.forEach(function (item) {
                var tmpPath = path + '/' + item;
                var stats = fs.statSync(tmpPath);
                if (item[0] == '.') {
                    return;
                }
                if (stats.isDirectory()) {
                    work(tmpPath, item);
                }
                else {
                    item = item.split('.')[0];
                    modules[item] = require(tmpPath);
                }
            });
        };
        work(path);
        return modules;
    },

    loadRoutes: function (path) {
        var routers = {};
        var work = function (path, parent) {
            var files = fs.readdirSync(path);
            files.forEach(function (item) {
                var tmpPath = path + '/' + item;
                var stats = fs.statSync(tmpPath);
                if (item[0] == '.') {
                    return;
                }
                if (stats.isDirectory()) {
                    routers[item] = express();
                    try {
                        routers[item] = require(tmpPath + '/index');
                    }
                    catch (err) {
                    }
                    work(tmpPath, item);
                }
                else if (parent != '') {
                    item = item.split('.')[0];
                    routers[parent].use('/' + item, require(tmpPath));
                }
                else {
                    item = item.split(".")[0];
                    if (item != 'index') {
                        routers[item] = require(tmpPath);
                    }
                }
            });
        };
        work(path, '');
        return routers;
    },

    response: function (res, data) {
        res.send({code: data.code, message: data.message, env: env, data: data.data});
        logger.debug('[响应][' + utils.getClientIp(res.req) + ']', JSON.stringify({ code: data.code, message: data.message, env: env, data: data.data }));
    }
};
