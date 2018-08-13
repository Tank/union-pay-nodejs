'use strict';

const request = require('request');
const fs = require('fs');
const crypto = require('crypto');
const iconv = require("iconv-lite");
const moment = require('moment');
const pemutils = require("pemutils");

var utils = module.exports = {};

/**
 * 签名
 * @param str 签名串
 * @param privateKey 私钥
 */
utils.sign = function(str, privateKey) {
    var sha1 = crypto.createHash('sha1');
    sha1.update(str, 'utf8');

    // RSA签名
    var sign = crypto.createSign('RSA-SHA1');
    sign.update(sha1.digest('hex'));

    return sign.sign(privateKey, 'base64');
}

//验签
utils.verify = function(params, publicKey) {
    var signature_str = params.signature;
    var preString = utils.querystring(params, false);
    var preString = iconv.encode(preString, 'utf-8');

    //sha1
    var sha1 = crypto.createHash('sha1');
    sha1.update(preString);
    var ss1 = sha1.digest('hex');

    //公钥验签
    var verifier = crypto.createVerify("RSA-SHA1");
    verifier.update(ss1);
    var result = verifier.verify(publicKey, signature_str, "base64");
    return result;
};


/**
 * 将参数按顺序转换成querystring形式
 * @param {object} params 
 * @param {boolean} encode 
 */
utils.querystring = function(params, encode) {
    var str = '', ks = Object.keys(params).sort();
    for (var i = 0; i < ks.length; i++) {
        var k = ks[i];
        if (encode == true) {
            k = encodeURIComponent(k);
        }
        if (str.length > 0) {
            str += '&';
        }
        if (k != null && k != undefined && k != '') { //如果参数的值为空不参与签名；
            str += k + '=' + params[k];
        }
    }
    return str;
};

/**
 * 生成需要的参数
 * @param {*} obj 生成参数
 * @param {Object} context 上下文
 * @return {Object}
 */
utils.buildParams = function(obj, context) {
    var params = {
        version: '5.0.0',       // 版本号，固定
        encoding: 'UTF-8',
        bizType: obj.bizType,               // 产品类型
        txnTime: moment().format('YYYYMMDDhhmmss'),   // 订单时间
        currencyCode: '156',                // 交易币种
        txnAmt: String(obj.txnAmt),         // 交易金额，单位为分
        signMethod: "01",                   // 签名方式，01表示RSA，11表示SHA-256,12表示SM3
        txnType: obj.txnType,               // 交易类型
        txnSubType: obj.txnSubType,         // 交易子类
        accessType: "0",                    // 接入类型，0表示普通商户，1表示平台类商户
        channelType: '08',                  // 渠道类型
        merId: context.merId,               // 商户ID
        frontUrl: context.frontUrl,         // 前台通知地址
        certId: context.certId,             // 证书ID
        orderId: obj.orderId,               // 商户订单号
        orderDesc : obj.orderDesc || ""     // 订单描述
    };
    var preString = utils.querystring(params, true);
    preString = iconv.encode(preString, 'utf-8');
    // 签名
    params.signature = utils.sign(preString, context.privateKey);
    return params;
};

/**
 * 网络请求
 * @param {*} url 请求地址
 * @param {*} form 请求参数
 */
utils.request = function(url, form) {
    return new Promise( (resolve, reject) => {
        request.post(url, { form }, function (error, response, body) {
            // 调用成功
            if (!error && response && response.statusCode == 200) {
                resolve(body);
            } else {
                reject(error);
            }
        });
    })
}

/**
 * 解析pfx文件
 * @param {*} path 文件路径
 * @param {*} password 文件密码
 */
utils.pfx2pem = function(path, password) {
    return new Promise((resolve, reject) => {
        pemutils.fromPfx({
            path,
            password,
        }, (err, res) => {
            if (err)
                reject(err);
            else
                resolve(res);
        });
    });
}

utils.h2d = function(s) {
    function add(x, y) {
        let c = 0;
        const r = [];
        x = x.split('').map(Number);
        y = y.split('').map(Number);
        while (x.length || y.length) {
            const s = (x.pop() || 0) + (y.pop() || 0) + c;
            r.unshift(s < 10 ? s : s - 10);
            c = s < 10 ? 0 : 1;
        }
        if (c)
            r.unshift(c);
        return r.join('');
    }
    let dec = '0';
    s.split('').forEach(function (chr) {
        let n = parseInt(chr, 16);
        for (let t = 8; t; t >>= 1) {
            dec = add(dec, dec);
            if (n & t)
                dec = add(dec, '1');
        }
    });
    return dec;
}
