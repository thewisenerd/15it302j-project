drop database if exists `writr_db`;
create database if not exists `writr_db` character set utf8mb4 collate utf8mb4_bin;
use `writr_db`;

drop table if exists `writr_users`;
create table `writr_users` (
  `username` varchar(64) not null,
  `pass` varchar(255) not null,
  `key` varchar(255) default null,
  `role` char not null default 'W',
  `displayname` varchar(255) not null,
  `displaydesc` text not null,
  `email` varchar(255) not null,
  primary key (`username`)
);

drop table if exists `writr_categories`;
create table `writr_categories` (
  `categoryid` int not null auto_increment,
  `name` varchar(64) unique not null,
  `order` int not null default '99999',
  primary key (`categoryid`)
);

drop table if exists `writr_articles`;
create table `writr_articles` (
  `articleid` int not null auto_increment,
  `categoryid` int not null,
  `title` text not null,
  `author` varchar(64) not null,
  `content` longtext not null,
  `date` datetime default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP,
  `isdraft` boolean not null default 1,
  primary key (`articleid`),
  foreign key (`categoryid`) references `writr_categories`(`categoryid`),
  foreign key (`author`) references `writr_users`(`username`)
) auto_increment=1;

drop table if exists `writr_featured`;
create table `writr_featured` (
  `articleid` int not null unique,
  `order` int not null default '99999',
  primary key (`articleid`),
  foreign key (`articleid`) references `writr_articles`(`articleid`)
);

drop table if exists `writr_comments`;
create table `writr_comments` (
  `commentid` bigint not null auto_increment,
  `articleid` int not null,
  `message` text not null,
  `parent` int not null,
  `author` varchar(64) not null,
  `date` datetime default CURRENT_TIMESTAMP,
  primary key (`commentid`),
  foreign key (`articleid`) references `writr_articles`(`articleid`),
  foreign key (`author`) references `writr_users`(`username`)
);

drop view if exists `writr_articles_featured`;
create view `writr_articles_featured` as
  select
    `writr_featured`.`articleid` as `articleid`,
    `writr_categories`.`name` as `category`,
    `writr_articles`.`title` as `title`,
    `writr_articles`.`author` as `author`,
    `writr_articles`.`content` as `content`,
    `writr_articles`.`date` as `date`,
    (select count(*) from `writr_comments` where `writr_comments`.`articleid` = `writr_articles`.`articleid`) as `commentcount`
  from `writr_featured`
  left join
    `writr_articles` on `writr_featured`.`articleid` = `writr_articles`.`articleid`
  left join
    `writr_categories` on `writr_articles`.`categoryid` = `writr_categories`.`categoryid`
  where
    `writr_articles`.`isdraft` != 1
  order by `writr_featured`.`order` asc;


/* sample data? */
INSERT INTO `writr_categories` VALUES (1,'General',1);
INSERT INTO `writr_users` VALUES
  ('editor','$2a$04$OhZlm0BhV43U8VKTrsUoyeT6hhoCr23LRxnhjUH1tnf/5BeZn6F5C','d8d2f1a46829e33c552f2615e89ab73eea487033e6ee0b000b721aee27ad6ab6ec788fae66e9b3c5ee3ee589de10673fae20e2ef32905b9d71cc04df27fd52bc','E','Editor Doe','<i>editor. more or less.</i>','editor@email.com'),
  ('dummy','$2a$04$OhZlm0BhV43U8VKTrsUoyeT6hhoCr23LRxnhjUH1tnf/5BeZn6F5C','e77491b9889a5b5875701fd4d848452cf9d5d3ab4b15776a1e23424a128ed88f8e71249cee987978dba121c1f35d7419b2f3066366be8aca0aa1add8e5f6ce8b','W','Dummy Doe','<i>dummy. more or less.</i>','dummy@email.com');
INSERT INTO `writr_articles` VALUES
  (2,1,'dummy title','editor','dummy content','2017-10-03 10:05:19',0),
  (3,1,'dummy title','dummy','dummy content','2017-10-03 09:44:17',1),
  (4,1,'dummy title','dummy','dummy content','2017-10-03 09:45:52',0),
  (7,1,'dummy title','dummy','dummy content','2017-10-03 10:03:40',1);
INSERT INTO `writr_featured` VALUES
  (2,6),
  (4,5);
