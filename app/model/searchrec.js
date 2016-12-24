'use strict';

var pg = require('pg');
pg.defaults.ssl = true; // 对于heroku时必须要，注意取消注释
var conString = process.env.DATABASE_URL || 'postgres://test:test@localhost:5432/test'; // 定义数据库连接URI
module.exports =function(){return new pg.Client(conString);}