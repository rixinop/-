/*
 * @Author: zhangrixin
 * @Date: 2019-09-05 17:01:01
 * @Last Modified by: zhangrixin
 * @Last Modified time: 2019-09-05 17:03:35
 */

const async = require("async");
const fs = require("fs");
const path = require("path");

// 获取命令行参数
var fucodir = process.argv[2];
console.log("目标文件夹名称", fucodir);

var checkNum = -1; // 定时检测的初始值

var filePathArr = []; // 文件路径的数组

var relativePath = "\\static" + (fucodir ? "\\" + fucodir : "");
// 拿到需要遍历的路径
var root = path.join(__dirname) + relativePath;
// 递归创建目录 异步方法
function mkdirs(dirname, callback) {
  fs.exists(dirname, function(exists) {
    if (exists) {
      callback();
    } else {
      // console.log(path.dirname(dirname));
      mkdirs(path.dirname(dirname), function() {
        fs.mkdir(dirname, callback);
        console.log(
          "在" + path.dirname(dirname) + "目录创建好" + dirname + "目录"
        );
      });
    }
  });
}
// 读取原始文件，递归创建文件夹后写入文件
function inputData(filePath, callback) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      throw new Error(err);
    } else {
      let temparr = filePath.split("static");
      let pathname = temparr[temparr.length - 1];
      // console.log("pathname", pathname);
      let aimdir = path.dirname(__dirname + "\\myname" + pathname);
      // console.log(aimdir);
      mkdirs(aimdir, () => {
        try {
          const startMs = new Date().getTime();
          fs.writeFile(__dirname + "\\myname" + pathname, data, () => {
            const endMs = new Date().getTime();
            console.log(
              "写入:",
              "\\myname" + pathname,
              " 耗时:",
              endMs - startMs + "ms"
            );
            callback(); // 必须，写入结束后通知并发控制器，否则并发无法走下去
          });
        } catch (error) {
          throw new Error(error);
        }
      });
    }
  });
}

// 使用异步获取路径
// 参数是遍历文件的根路径
function readDirSync(apath) {
  var pa = fs.readdirSync(apath);
  // console.log(pa);
  // 循环遍历当前的文件以及文件夹
  pa.forEach(function(ele, index) {
    var info = fs.statSync(apath + "\\" + ele);
    if (info.isDirectory()) {
      // console.log("dir: "+ele)
      readDirSync(apath + "\\" + ele);
    } else {
      var filePath = apath + "\\" + ele;
      filePathArr.push(filePath);
    }
  });
}

readDirSync(root);

var timer = setInterval(() => {
  if (checkNum == filePathArr.length) {
    clearInterval(timer);
    console.log(
      "一秒内目录数据未增加,开始写入",
      "总计：" + filePathArr.length + "条"
    );
    // 并发控制，防止同时打开过多文件报错
    async.mapLimit(
      filePathArr,
      20,
      function(filePath, callback) {
        inputData(filePath, callback);
      },
      function(err, result) {
        if (err) {
          throw new Error(err);
        } else {
          console.log("结束", "总计：" + filePathArr.length + "个文件");
        }
      }
    );
  } else {
    checkNum = filePathArr.length;
  }
}, 1000);
