"use strict"
var fs = require('fs');
var read = fs.readFileSync;
var ejs = require("ejs");
var SearchRec = require(process.cwd() + '/app/model/searchrec.js'),
    Bing = require('bing.search'),
    util = require('util');


var errobj={};

module.exports = function(app) {


var bing = new Bing(process.env.BING_ACC_KEY,50,true);


  //根路径处理
    app.route('/')
    .get(function(req,res){
        let serverHost=req.protocol+"://"+req.host+"/"
        let noRestStr= ejs.render(read(process.cwd() +"/root.ejs","utf-8"),{serverHost:serverHost});
        res.end(noRestStr);
    });


  //imagesearch api
app.route('/api/imagesearch/:sstr?/:page?')
    .get(function(req,res){
        if(!req.params.sstr) {
            let serverHost=req.protocol+"://"+req.host+"/"
            let noRestStr= ejs.render(read(process.cwd() +"/root.ejs","utf-8"),{serverHost:serverHost});
            res.end(noRestStr);
        } else {
            console.log("搜索 : " + req.params.sstr);
            let Istr="INSERT INTO searchrec (sdate,sstr) VALUES( CURRENT_TIMESTAMP , '"+req.params.sstr+"')";
            let searchRec=new SearchRec;
            searchRec.connect(function(err){
                if(err){
                    console.log("数据库连接出错1:"+JSON.stringify(err));
                    res.end("数据库连接出错1");
                }
                searchRec.query(Istr,function(e,dbrt){ //插入查询信息到数据库
                    searchRec.end();// 无论是否有错误，先中断数据库连接
                    if(e){
                        console.log("数据库查询出错1:"+JSON.stringify(e));
                        errobj["error"]="数据库查询出错1"
                        res.end(JSON.stringify(errobj),"utf-8");
                        return;
                    }
                });
            });
        //利用bing搜索图片
        var skipNo = 0;
        if (req.params.page){
            skipNo = req.params.page*10;
        }
        console.log("跳过 : " + skipNo)
        //*
        bing.images(req.params.sstr,
            {top: 10,skip: skipNo},
            function(err, results) {
            if (err) {
                console.log("Bing查询出错:"+JSON.stringify(err));
                //throw(err);
            }
                res.end(JSON.stringify(results.map(function(doc){
                var newDoc ={"context":doc.sourceUrl, "thumbnail":doc.thumbnail.url,"snippet":doc.title, "url":doc.url}
                return newDoc;
                })));
            }
        );
        //*/
        //res.end("插入数据OK");
    };
});

app.route('/api/latest')
.get(function(req,res){
    console.log('/api/latest');
    let Qstr="SELECT sdate, sstr FROM searchrec  ORDER BY sdate DESC LIMIT 10";
    let searchRec=new SearchRec;
    searchRec.connect(function(err){
                if(err){
                    console.log("数据库连接出错1:"+JSON.stringify(err));
                    res.end("数据库连接出错1");
                }
        searchRec.query(Qstr,function(e,dbrt){
                    searchRec.end();// 无论是否有错误，先中断数据库连接
                    if(e){
                        console.log("数据库查询出错2:"+JSON.stringify(e));
                        errobj["error"]="数据库查询出错2"
                        res.end(JSON.stringify(errobj),"utf-8");
                        return;
                    }
                    console.log(JSON.stringify(dbrt));
                    if(dbrt.rowCount>0){
                        //console.log(JSON.stringify(dbrt));
                            res.end(JSON.stringify(dbrt.rows.map(function(doc){
                                var newDoc ={"term":doc.sstr, "date":doc.sdate}
                                return newDoc;
                            })));
                        return;
                    }else{
                        errobj["error"]="数据库错误3"
                        console.log("数据库错误3");
                        res.end(JSON.stringify(errobj),"utf-8");
                        return;
                    }
                });  
        });  
  });



    //all other get request will result in 400 error
    app.use(function(req, res){
        res.redirect('/');
    });



}