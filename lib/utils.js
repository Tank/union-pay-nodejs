'use strict';

const request = require('request');
const fs = require('fs');
const crypto = require('crypto');
const iconv = require("iconv-lite");
const sd = require('silly-datetime');
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
    params = this.filterPara(params);
    var preString = utils.createLinkString(params, false);
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
utils.createLinkString = function(params, encode) {
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
 * 生成银联支付需要的参数
 * @param {*} obj 
 * - {String} orderId 订单id
 * - {Integer} txnAmt 金额(分)
 * - {String} orderDesc 订单描述
 * @return {Object}
 */
utils.buildParams = function(obj, context) {
    var params = {
        version: '5.0.0',
        encoding: 'UTF-8',
        signMethod: "01",
        txnType: "01",
        txnSubType: "01",
        bizType: "000201",
        accessType: "0",
        currencyCode: '156',
        channelType: '08',
        txnTime: sd.format(new Date(), 'YYYYMMDDhhmmss'),
        merId: context.merId,
        frontUrl: context.frontUrl,
        certId: context.certId,
        orderId: obj.orderId,
        txnAmt: String(obj.txnAmt),
        orderDesc : obj.orderDesc || ""
    };
    var preString = utils.createLinkString(params, true);
    preString = iconv.encode(preString, 'utf-8');
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
