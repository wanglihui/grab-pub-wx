# grab-wx-pub 自动抓取微信公众号信息
---

###### 模拟登录并且获取token
---
    RobotGrab#login (username, pwd, code, callback)
        >1. err
        >2. result
            - msg
            - imgcode 如果错误码 -8，返回imgcode

| 参数            | 示意             |
|-----------------|------------------|
| username        | 用户名           |
| pwd             | 密码             |
| code            | 验证码,可选仅当密码错误次数太多时，需要验证       |
| callback        | 可选回调函数,如果不传，返回promise         |



######  获取微信号基本信息
---
    RobotGrab#getAccountInfo(callback)
    >1. err
    >2. result
        - ret           错误吗
        - msg           错误消息
        - name          名称
        - originalId    原始ID
        - accountType   1.服务号 2.订阅号
        - isVerify      true认证 false未认证

| 参数            | 示意             |
|-----------------|------------------|
| callback | 可选回调，如果不传，返回promise|


###### 开启开发者模式
---
    GrabRobot#openDev(callback)
    >1. err
    >2. result
        - ret
        - msg

| 参数            | 示意             |
|-----------------|------------------|
| callback | 可选回调，如果不传，返回promise|

###### 设置oauth2回调域名
---
    GrabRobot#setOAuthDomain(domain, callback)
    >1. err
    >2. result
        - ret
        - msg
        - domain

| 参数            | 示意             |
|-----------------|------------------|
| domain| oauth授权成功后绑定的回调地址域名 |

###### 配置微信公众号token以及接受消息地址
---
    GrabRobot#receiveMessageConfig(validMsgToken, receiveMsgUrl, encrypt_mode, aeskey, callback)
    >1. err
    >2. result
        - ret
        - msg
        - callback_token
        - url
        - encodingKey
        - callback_encrypt_mode

| 参数            | 示意             |
|-----------------|------------------|
| validMsgToken | 开启开发者模式时，需要设置的token|
| receiveMsgUrl | 开启开发者模式时，填写的接收消息地址|
| encrypto_mode | 加密方式 0. 明文 ,|
|aeskey |密阴|
|callback | 可选回调，如果不传，使用promise形式 |

###### 错误码详情
---
| ret    | 错误消息(msg)         |
|--------|-----------------------|
|"0"     | "OK",                 |
|"-1"    |"系统错误              |
|"-8"    | "需要输入验证码"      |
| "-21"  |"用户不存在",          |
| "-23   | "密码不正确",         |
|"-24"   | "获取登录凭证失败",   |
|"-15"   | "设置oauth2失败"      |
|"-302"  | "token验证失败"       |
|"-18"   | "缺少cookies"         |
|"-19"   | "缺少token"           |

###### 使用 example
---

    1. npm install top-wx-grab
    2. 项目中使用，见下方:
```
    var robot = new GrabRobot();
    robot.login('username', 'password', '')
        .then(function(result) {
            if (result.ret === 0) {
                return robot.getAccountInfo()
            } else {
                return result;
            }
        })
        .catch(function(err){
          throw err;
        })
        .done(function(result) {
            if (result.ret !== 0 ) {
                //有错误了
                console.info(result.msg);
            } else {
                //获取成功
                console.info(result)
            }
        });
```

###### 依赖
---
    Q.js
    request.js
