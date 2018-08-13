'use strict'

const utils = require('./utils');
const gateway = require('./gateway');
const fs = require('fs');

class Unionpay {
    /**
    * 初始化
    * @param {Object} opts 配置信息
    * - merid 商户ID
    * - frontUrl 通知地址
    * - cer 证书文件
    * - pfxPath 证书文件路径
    * - pfxPassword 证书文件密码
    */
    constructor(opts) {
        this.merId = opts.merId;
        this.frontUrl = opts.frontUrl;
        this.pfxPath = opts.pfxPath;
        this.pfxPassword = opts.pfxPassword;
        this.cer = opts.cer;
        this.sandbox = opts.sandbox || false;
        this.certId = '';
        this.publicKey = '';
        this.privateKey = '';
    }

    /**
     * 初始化key
     */
    async initKey() {
        if (this.certId && this.publicKey && this.privateKey) 
            return;
        const pem = await utils.pfx2pem(this.pfxPath, this.pfxPassword);
        this.privateKey = pem.key;
        this.certId = utils.h2d(pem.attributes.serial);
        this.publicKey = fs.readFileSync(this.cer).toString();
    }

    /**
     * 银联支付-app控件支付-消费类交易，获取参数
     * @param {Object} obj
     * - orderId 订单id
     * - txnAmt 金额(分)
     * - orderDesc 商品描述
     * @return tn 交易流水号 出错为null
     */
    async getAppTn(obj) {
        // App支付特定类型设置
        obj.bizType = "000201";
        obj.txnType = "01";           // 交易类型
        obj.txnSubType = "01";        // 交易子类
        return new Promise(async (resolve, reject) => {
            let formData = await utils.buildParams(obj, this);
            const body = await utils.request(this.sandbox ? gateway.appTransReq.test : gateway.appTransReq.product, formData);
            var tn = null;
            var s = body.split('&');
            for (var i in s) {
                var a = s[i];
                var k = a.split('=');
                if (k[0] == 'tn') {
                    tn = k[1] || null;
                    break;
                }
            }
            if(tn){
                resolve(tn);
            }else{
                reject(body)
            }
        })
    };

    /**
     * 交易查询
     * @param {Object} obj
     * - orderId 订单id
     * @return {Object}
     */
    async queryTrade(obj) {
        // 支付查询特定类型设置
        obj.bizType = "000802";       // 产品类型
        obj.txnType = "00";           // 交易类型
        obj.txnSubType = "00";        // 交易子类
        return new Promise(async (resolve, reject) => {
            let formData = await utils.buildParams(obj, this);
            const body = await utils.request(this.sandbox ? gateway.queryTrans.test : gateway.queryTrans.product, formData);
            if (body) {
                resolve(body);
            } else {
                reject(body);
            }
        })
    };

    /**
     * 银联验签
     * @param {Object} obj 银联的回调参数
     * @return {Bool} true则签名成功
     */
    async verify(obj) {
        return new Promise(async (resolve, reject) => {
            let result = await utils.verify(req.body);
            if (!result) {
                reject('签名失败')
            }
            let transStatus = req.body.respCode;
            if ("" != transStatus && "00" == transStatus) {
                resolve(true)
            } else {
                reject('返回数据出错')
            }
        })
    }

}

module.exports = Unionpay;
