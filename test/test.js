/**
 * Created by think on 2015/1/15.
 */
var assert = require("assert");
var constant = require('../lib/constant.json');
var GrabRobot = require('../index').GrabRobot;

describe("lib/index.js", function() {

  var robot = new GrabRobot();
  var testAccount = {
    username: "test@example.com", //换成自己测试账号
    pwd: "password"       //换成自己测试账号密码
  };

  var testConfigReceiveMsg = {
    token: "BE7uBRqjHSi1aOsqKcCz1oPLWqRStICY",
    url: "http://test.tulingdao.com/weixin/cb?id=549791b41793e7b55ab54a05",
    aeskey: "NlqjyehGuJzPPyNECqGeEtslJqkPGmHncltzGbOiPjm",
    encrypto_mode: 0
  }

  describe("GrabRobot#login", function(){
//    it("should be return ret == -21, with error account", function(done) {
//      robot.login('wangdana', 'caoni', '')
//        .then(function(result) {
//          assert.equal(result.ret, -21);
//          assert.equal(result.msg, constant.errors[result.ret]);
//          done();
//        })
//        .catch(function(err) {
//          throw err;
//        })
//        .done();
//    });

//    it("should be return contain imgcode if need verifycode", function(done) {
//      robot.login(testAccount.username, testAccount.pwd, '')
//        .then(function(result) {
//          if (result.ret == -8) {
//            assert.notEqual(result.imgcode, null);
//            assert.equal(result.msg, constant.errors[result.ret]);
//            done();
//          } else {
//            done();
//          }
//        })
//        .catch(function(err) {
//          throw err;
//        })
//        .done();
//    })

    it("should be return ret 0, with correct account", function(done) {
      robot.login(testAccount.username, testAccount.pwd, '')
        .then(function(result) {
          assert.equal(result.ret, 0);
          assert.equal(result.msg, constant.errors[result.ret]);
          done();
        })
        .catch(function(err) {
          throw err;
        })
        .done();
    });

//    it("should be return ret -23, with password wrong", function(done) {
//      robot.login(testAccount.username, '123456', '')
//        .then(function(result) {
//          assert.equal(result.ret, -23);
//          done();
//        });
//    });
  });

  describe("GrabRobot#getAccountInfo", function() {

    it("should be ok with login", function(done) {
      robot.login(testAccount.username, testAccount.pwd, '')
        .then(function(result) {
          if (result.ret == 0) {
            return robot.getAccountInfo()
          } else {
            return result;
          }
        })
        .then(function(result) {
          assert.equal(result.ret, 0);
          done();
        })
        .done();
    })
  });

  describe("GrabRobot#openDev", function() {
    //测试开启开发者模式
    it("should be ok with login", function(done) {
      robot.login(testAccount.username, testAccount.pwd, '')
        .then(function(result) {
          if (result.ret == 0) {
            //登陆成功，请求开启开发者模式
            return robot.openDev();
          } else {
            return result;
          }
        })
        .then(function(result) {
          assert.equal(result.ret, 0);
          console.info(result);
          done();
        })
        .catch(function(err) {
          throw err;
        })
        .done();
    });
  });

  describe("GrabRobot#setOAuthDomain", function() {

    it("should be ok with login", function(done) {
      robot.login(testAccount.username, testAccount.pwd, '')
        .then(function(result) {
          if (result.ret == 0) {
            return robot.setOAuthDomain('test.tulingdao.com');
          } else {
            return result;
          }
        })
        .then(function(result) {
          assert.equal(result.ret, 0);
          console.info(result);
          done();
        })
        .catch(function(err) {
          throw err;
        })
        .done();
    })
  })

  describe("GrabRobot#receiveMessageConfig", function() {

    it("should be ok with correct url", function(done) {
      robot.login(testAccount.username, testAccount.pwd, '')
        .then(function(result) {
          if (result.ret == 0) {
            return robot.receiveMessageConfig(testConfigReceiveMsg.token, testConfigReceiveMsg.url, 0, null)
          } else {
            return result;
          }
        })
        .catch(function(err) {
          throw err;
        })
        .done(function(result) {
          console.info(result);
          assert.equal(result.ret, 0);
          done();
        })
    })
  })
})
