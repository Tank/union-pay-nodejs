## 安装
``` npm install union-pay-nodejs```

## 示例
通过地址[申请测试账号](https://open.unionpay.com/ajweb/account/testPara)

```
const Unionpay = require('../lib/unionpay');
const path= require('path');

const pfxPath = path.join(__dirname , 'pem/700000000000001_acp.pfx');
const pfxPassword = '000000';
const merId = '777290058162218';
const cer = path.join(__dirname , 'pem/verify_sign_acp.cer');

(async () => {
    // 初始化
    const unionPay = new Unionpay({
        merId : "777290058162218",
        frontUrl : "http://127.0.0.1/unionpay/notify",
        pfxPassword,
        pfxPath,
        cer,
        sandbox: true,
    });
    // 初始化私钥公钥
    await unionPay.initKey();

    // 获取tn直接通过app唤起SDK
    const tn = await unionPay.getAppTn({
        orderId: Date.now(),
        txnAmt: 10,
        orderDesc: "支付测试"
    });
    console.log('========:tn:========', tn);
})();

```