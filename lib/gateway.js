module.exports = gateway = {
    // 前台交易请求地址
    frontTransReq: {
        test: "https://gateway.test.95516.com/gateway/api/frontTransReq.do",
        product: "https://gateway.95516.com/gateway/api/frontTransReq.do"
    },
    // APP交易请求地址
    appTransReq: {
        test: "https://gateway.test.95516.com/gateway/api/appTransReq.do",
        product: "https://gateway.95516.com/gateway/api/appTransReq.do"
    },
    // 后台交易请求地址(无卡交易配置该地址):
    backTransReq: {
        test: "https://gateway.test.95516.com/gateway/api/backTransReq.do",
        product: "https://gateway.95516.com/gateway/api/backTransReq.do"
    }, 
    //后台交易请求地址(若为有卡交易配置该地址)：
    cardTransReq: {
        test: "https://gateway.test.95516.com/gateway/api/cardTransReq.do",
        product: "https://gateway.95516.com/gateway/api/cardTransReq.do"
    },
    //单笔查询请求地址:
    queryTrans: {
        test: "https://gateway.test.95516.com/gateway/api/queryTrans.do",
        product: "https://gateway.95516.com/gateway/api/queryTrans.do",
    }
}