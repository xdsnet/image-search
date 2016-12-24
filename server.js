'use strict'
var express = require('express'),
    app = express(),
    dotenv = require('dotenv').config({silent: true}),
    routes = require(process.cwd() + '/app/routes/index.js');

    //设置监听端口为配置的PORT或者8080
    app.set('port', (process.env.PORT || 8080));

    routes(app);

    app.listen(app.get('port'), function(){
      console.log("服务已启动，监听端口:" + app.get('port') + "...");
});