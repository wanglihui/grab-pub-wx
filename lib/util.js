/**
 * Created by YCXJ-wanglihui on 2015/1/16.
 */
'use strict';

/**
 * 随机生成字符串
 * @param length 生成长度
 */
function randString(length) {
  var original = 'abcdefghijklmn0pqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var ret = [];
  var idx = 0;
  for(var i=0; i<length; i++) {
    idx = parseInt(Math.random() * length);
    ret.push(original[idx]);
  }
  return ret.join("");
}

exports.randomString= randString;