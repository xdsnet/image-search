"use strict"
var fs = require('fs');
var read = fs.readFileSync;
var ejs = require("ejs");
var SearchRec = require(process.cwd() + '/app/model/searchrec.js'),
    Google = require('googleapis'),
    util = require('util');
var customsearch = Google.customsearch('v1');
        const CX = process.env.GOOGLE_CX;
        const API_KEY = process.env.GOOGLE_KEY;

var errobj={};

module.exports = function(app) {

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
        //let CREF='https://cse.google.com/cse/publicurl?cx=003345433584895644800:yvh2g3fh0mi';
        let SEARCH = req.params.sstr;
        customsearch.cse.list({ cx:CX, q: SEARCH, auth:API_KEY, start:skipNo, searchType:"image"}, function (err, resp) {
            if (err) {
                err["test"]={ cx:CX, q: SEARCH, auth:API_KEY, start:skipNo, searchType:"image"}
                console.log('搜索出现问题', err);
                errobj["error"]="搜索出现问题";
                //errobj["err"]=err;
                res.end(JSON.stringify(errobj),"utf-8");
                return;
            }
            // Got the response from custom search
            console.log('Result: ' + resp.searchInformation.formattedTotalResults);
            if (resp.items && resp.items.length > 0) {
                console.log('First result name is ' + resp.items[0].title);
                 res.end(JSON.stringify(resp.items.map(function(doc){
                var newDoc ={"context":doc.image.contextLink, "thumbnail":doc.image.thumbnailLink,"snippet":doc.title, "url":doc.link}
                return newDoc;
                })));
            }
        });
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