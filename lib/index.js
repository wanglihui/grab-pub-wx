/**
 * Created by YCXJ-wanglihui on 2015/1/15.
 */
'use strict';

var R = require('request'),
  Q = require('q'),
  crypto = require('crypto'),
  constant = require("./constant.json"),
  randomString = require('./util').randomString;

/**
 * WX_HOST 微信服务器地址
 */
var WX_HOST = constant.wx_host;

/**
 *  ERROR 错误码
 */
var ERROR_CODE = constant.errors;

function GrabRobot() {
}

/**
 * 登陆
 * @param username 用户名
 * @param pwd 密码
 * @param code  验证码
 */
GrabRobot.prototype.login = function(username, pwd, code, callback) {
  /**
   * HEADERS 发送http请求基本头信息
   **/
  var HEADERS = constant.headers;
  var obj = this;
  var defer = Q.defer();
  var url = WX_HOST + "/cgi-bin/login?lang=zh_CN";
  var md5 = crypto.createHash('md5');
  md5.update(pwd);
  pwd = md5.digest('hex');
  if (!code) {
    code = '';
  }
  var form = {
    username: username,
    pwd: pwd,
    f : "json",
    imgcode: code
  }
  var j = R.jar();
  HEADERS["Accept"] = "Accept:application/json, text/javascript, */*; q=0.01";
  HEADERS["X-Requested-With"] = "XMLHttpRequest";
  var opt = {
    method: "post",
    form: form,
    headers: HEADERS,
    url: url,
    f: "json",
    jar: j
  };

  R(opt, function (err, resp, body) {
    if (err) {
      defer.reject(err);
    } else {
      var result = null,
        ret = -21,  //用户名或密码错误
        redirectUrl = '',
        token = "",
        cookies = "";
      result = JSON.parse(body);
      ret = result.base_resp.ret;
      var msg = '';

      if (ret === 0) {
        msg = ERROR_CODE[ret];
        redirectUrl = result.redirect_url;
        var reg = /token=(\d+)/,
        r = reg.exec(redirectUrl);
        if (r) {
          token = r[1];
          cookies = j.getCookieString(url);
          obj.token = token;  //写入到GrabRobot实例中
          obj.cookies = cookies;
          defer.resolve({ret:ret, msg:msg});
        } else {
          ret = -24;  //获取登录凭证失败
          msg = ERROR_CODE[ret];
          defer.resolve({ret:ret, msg:msg});
        }
      } else {
        msg = ERROR_CODE[ret];
        //需要验证码
        if (ret === -8) {
          defer.resolve({ret:ret, msg:msg, imgcode: WX_HOST+"/verifycode?username="+username+"&r="+Math.random()})
        } else {
          defer.resolve({ret: ret, msg:msg});
        }
      }
    }
  });
  return defer.promise.nodeify(callback)
}

/**
 * 获取微信公众号基本信息
 * @param callback
 * @returns {*}
 */
GrabRobot.prototype.getAccountInfo = function(callback) {
  /**
   * HEADERS 发送http请求基本头信息
   **/
  var HEADERS = constant.headers;
  var obj = this;
  var defer = Q.defer();
  //判断token,cookies是否存在
  if (!obj.token || !obj.cookies) {
    var err = new Error('login certification invalid');
    defer.reject(err);
  } else {
    //获取账户信息
    var url = WX_HOST + "/cgi-bin/settingpage?t=setting/index&action=index&token="+ obj.token +"&lang=zh_CN"
    var j = R.jar();
    HEADERS.cookie = obj.cookies;
    R({url: url, headers: HEADERS}, function(err, res, body) {
      if (err) {
        defer.reject(err);
      } else {
        //分析网页获取账号信息
        Q.all([
          getPubAccountName(body),
          getPubAccountOriginalId(body),
          getPubAccountType(body),
          getVerify(body)
        ])
          .spread(function(name, originalId, accountType, isVerify) {
            defer.resolve({ret: 0, name: name, originalId: originalId, accountType:accountType, isVerify:isVerify});
          })
          .catch(function(err) {
            defer.reject(err);
          })
          .done();
      }
    });
  }
  return defer.promise.nodeify(callback);
}


/**
 * 获取公共账号名称
 */
function getPubAccountName(body, callback) {
  //爬取名称、、、微信号、类型、认证情况
  var defer = Q.defer();
  var nameReg = /<li\sclass="account_setting_item">\s+<h4>名称<\/h4>\s+<div\sclass="meta_opr">\s+<\/div>\s+<div\sclass="meta_content">\s*(.{1,20})\s*<\/div>/
  var r = nameReg.exec(body);
  if (r) {
    defer.resolve(r[1].replace(/\s/g, ''))
  } else {
    defer.resolve('');
  }
  return defer.promise.nodeify(callback);
}

/**
 * 获取原始ID
 * @param body
 * @param callback
 * @returns {*}
 */
function getPubAccountOriginalId(body, callback) {
  //原始Id<h4>原始ID</h4>
  //    <div class="meta_opr">
  //    </div>
  //    <div class="meta_content">
  //        <span>gh_25908220c551</span>
  //        </div>
  //    </li>
//    var originalReg = /<div\sclass="meta_opr">\s+<\/div>\s+<div\sclass="meta_content">\s+<span>([a-z0-9_]+)<\/span>\s*<\/div>/
  var defer = Q.defer();
  //<h4>原始ID</h4>            <div class="meta_opr">            </div>            <div class="meta_content">                <span>gh_5098f3e9695d</span>
//  var originalReg = /<div\sclass="meta_content">\s+<span>([a-z0-9_]+)<\/span>\s+<\/div>\s+<\/li>/;
  var originalReg = /原始ID<\/h4>\s*<div\sclass="meta_opr">\s*<\/div>\s*<div\sclass="meta_content">\s*<span>([^<]+)<\/span>/
  var r = originalReg.exec(body);
  if (r) {
    defer.resolve(r[1])
  } else {
    defer.resolve('');
  }
  return defer.promise.nodeify(callback);
}

/**
 * 获取账号类型 1.服务号 2.订阅号
 * @param body
 * @param callback
 * @returns {*}
 */
function  getPubAccountType(body, callback) {
//    <li class="account_setting_item">
//        <h4>类型</h4>
//        <div class="meta_opr">
//        </div>
//        <div class="meta_content">
//        服务号                            </div>
//    </li>
  var defer = Q.defer();
  var accountTypeReg = /<li\sclass="account_setting_item">\s+<h4>类型<\/h4>\s+<div\sclass="meta_opr">\s+<\/div>\s+<div\sclass="meta_content">\s*(服务号)\s*<\/div>/;
  var r = accountTypeReg.exec(body);
  if (r) {
    var accountType = 0;
    if (r[1] === '服务号') {
      accountType = 1;
    } else if (r[1] === '订阅号') {
      accountType = 2;
    }
    defer.resolve(accountType);
  } else {
    defer.resolve('');
  }
  return defer.promise.nodeify(callback);
}

/**
 * 获取是否认证信息
 * @param body
 * @param callback
 * @returns {*}
 */
function getVerify(body, callback) {
  //认证情况
//    <div class="meta_content">
//    微信认证<i class="icon_verify_checked"></i>
//    </div>
  var defer = Q.defer();
  var verifyReg = /<div\sclass="meta_content">\s*(.{1,20})\s*<i\sclass="icon_verify_checked"><\/i>\s+<\/div>/;
  var r = verifyReg.exec(body);
  var isVerify = false;
  if (r && r[1] === '微信认证') {
    isVerify = true;
  }
  if (r) {
    defer.resolve(isVerify);
  } else {
    defer.resolve(isVerify);
  }
  return defer.promise.nodeify(callback);
}

/**
 * 开启开发者模式
 * @param callback
 * @returns {*}
 */
GrabRobot.prototype.openDev = function(callback) {
  var defer = Q.defer();
  var obj = this;
  var ret = -1,
    form = null;
  var HEADERS = constant.headers;

  form = {
    token: obj.token,
    lang: "zh_CN",
    f: "json",
    ajax: 1,
    random: Math.random(),
    flag: 1,
    type: 2
  };

  HEADERS.cookie = obj.cookies;
  R({url: WX_HOST + "/misc/skeyform?form=advancedswitchform", headers: HEADERS, method: "POST", form: form}, function (err, resp, body) {
    if (err) {
      defer.reject(err);
    } else {
      //'{"base_resp":{"ret":0,"err_msg":"ok"},"is_quick_reply_open":0,"is_dev_reply_open":0,"is_biz_menu_open":0,"is_biz_ivr_open":0,"is_customer_open":1,"can_set_dev_reply":1,"is_complete_base_info":1}
      var result = JSON.parse(body);
      ret = result.base_resp.ret;
      var msg = '';
      if (ret !== 0) {
        ret = -16;  //开启开发者模式失败
      }
      msg = ERROR_CODE[ret];
      defer.resolve({ret: ret, msg: msg});
    }
  });
  return defer.promise.nodeify(callback);
}

/**
 * 设置oauth回调域名
 * @param domain
 * @param callback
 * @returns {*}
 */
GrabRobot.prototype.setOAuthDomain = function(domain, callback) {
  var form, ret, msg;
  var obj = this,
    defer = Q.defer();
  form = {
    token: obj.token,
    lang: "zh_cn",
    f: "json",
    ajax: 1,
    random: Math.random(),
    domain: domain || "top.tulingdao.com"
  };
  var HEADERS = constant.headers;
  HEADERS.cookie = obj.cookies;

  //https://mp.weixin.qq.com/merchant/myservice?action=set_oauth_domain&f=json
  R({url: WX_HOST + "/merchant/myservice?action=set_oauth_domain&f=json", headers: HEADERS, method: "POST", form: form}, function (err, resp, body) {
    if (err) {
      defer.reject(err);
    } else {
      var result = JSON.parse(body);
      //'{"base_resp":{"ret":0,"err_msg":"ok"},"is_quick_reply_open":0,"is_dev_reply_open":0,"is_biz_menu_open":0,"is_biz_ivr_open":0,"is_customer_open":1,"can_set_dev_reply":1,"is_complete_base_info":1}
      ret = result.base_resp.ret;
      if (ret !== 0) {
        ret = -15;  //设置oauth2回调失败
      }
      msg = ERROR_CODE[ret];
      defer.resolve({ret: ret, msg: msg, domain: domain});
    }
  });
  return defer.promise.nodeify(callback);
}

GrabRobot.prototype.receiveMessageConfig = function(validMsgToken, receiveMsgUrl, encrypt_mode, aeskey, callback) {
  var obj = this;
  var defer = Q.defer();
  if (! encrypt_mode) {
    encrypt_mode = 0;
  }
  if (!aeskey) {
    aeskey = randomString(43);
  }
  //先获取操作码
  var url = WX_HOST + "/advanced/advanced?action=interface&t=advanced/interface&token=" + obj.token + "&lang=zh_CN";
  var HEADERS = constant.headers;
  HEADERS.cookie = obj.cookies;
  R({url: url, method: "GET", headers: HEADERS}, function (err, resp, body) {
    if (err) {
      defer.reject(err);
    } else {
      var seqReg = /operation_seq:\s"(\d+)"/,
        r = seqReg.exec(body),
        operate_seq = "";
      if (r) {
        operate_seq = r[1];
      }
      url = WX_HOST + "/advanced/callbackprofile?t=ajax-response&token=" + obj.token + "&lang=zh_CN";
      var form = {callback_token: validMsgToken, url: receiveMsgUrl, encoding_aeskey: aeskey, callback_encrypt_mode: encrypt_mode, operation_seq: operate_seq}
      R({url: url, form: form, headers: HEADERS, method: "POST"}, function(err, resp, body) {
        if (err) {
          defer.reject(err);
        } else {
          console.info(body);
          var res = JSON.parse(body);
          var ret = res.base_resp.ret;
          var msg = ERROR_CODE[ret];
          defer.resolve({ret: ret, msg: msg, callback_token: validMsgToken, url: receiveMsgUrl, encodingKey: aeskey, callback_encrypt_mode: encrypt_mode})
        }
      })
    }
  })
  return defer.promise.nodeify(callback);
}

module.exports = GrabRobot;

