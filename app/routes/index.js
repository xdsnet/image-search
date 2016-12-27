"use strict"
var fs = require('fs');
var read = fs.readFileSync;
var ejs = require("ejs");
var SearchRec = require(process.cwd() + '/app/model/searchrec.js'),
 //   Google = require('googleapis'),
    util = require('util');
//var customsearch = Google.customsearch('v1');
        const CX = process.env.GOOGLE_CX;
        const API_KEY = process.env.GOOGLE_KEY;

var errobj={};
var request=require('request');

//const ImagesClient = require(process.cwd() + '/app/modules/mygoogle-images.js')

var imageSearch = require('node-google-image-search');

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
        //利用google搜索图片
        var skipNo = 0;
        let page=req.params.page?parseInt(req.params.page):0;
        if (req.params.page){
            skipNo = page*10;
        }
        console.log("跳过 : " + skipNo)
        let SEARCH = req.params.sstr;

        //console.log("suri="+SEARCH);
        imageSearch(SEARCH, function(results) {
            console.log(JSON.stringify(results));
            res.json(results.map( function(e) {
                return {'url': e.link,
                        'alt-text': e.snippet,
                        'thumbnail': e.image.thumbnailLink,
                        'context': e.image.contextLink
                    };
                }));
        }, skipNo, skipNo + 10)

        /*
        let searchURI="https://www.googleapis.com/customsearch/v1?googlehost=google.com&safe=medium&searchType=image&key="
            +API_KEY
            +"&cx="+CX
            +"&q="+SEARCH
            +"&start="+page
            +"&num=10";
        request(searchURI,{json:true},function(error,response,data){
            if(!error && response.statusCode == 200) {
            var newData = data.items.map(function (item) {
              return {
                url: item.link,
                snippet: item.snippet,
                thumbnail: item.image.thumbnailLink,
                context: item.image.contextLink
                };
              });
            res.end(JSON.stringify(newData));
            }else if(error){
                console.log('搜索出现问题', error);
                errobj["error"]="搜索出现问题";
                res.end(JSON.stringify(errobj),"utf-8");
            }else{
                console.log('搜索出现其他问题1', response);
                console.log('搜索出现其他问题2', data);
                errobj["error"]="搜索出现其他问题";
                res.end(JSON.stringify(errobj),"utf-8");
            }
        });
        //*/
    };
});

app.route('/favicon.ico')
    .get(function(req,res){
    res.statusCode = 404;
    res.send('no found!');
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