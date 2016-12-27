# Image Search Abstraction Layer 任务 
完成Image Search Abstraction Layer 任务

服务演示地址[https://xdsisearch.herokuapp.com/](https://xdsisearch.herokuapp.com/)

## 实现说明
1. 使用了`Postgres`数据库服务用于持久化数据。只有一个表,表名为searchrec，表结构为{sdate date , sstr text}
2. 使用`ejs`作为模版处理模块。
3. 使用`node-google-image-search`作为搜索支持。



