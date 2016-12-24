DROP TABLE searchrec; -- 删除已有的表

CREATE TABLE searchrec( --构建表结构
    sdate timestamp  PRIMARY KEY,
    sstr text NOT NULL
) WITH (
    OIDS=FALSE
);