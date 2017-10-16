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

drop view if exists `writr_view_articles`;
create view `writr_view_articles` as
  select
    `writr_articles`.`articleid` as `articleid`,
    `writr_categories`.`name` as `category`,
    `writr_articles`.`title` as `title`,
    `writr_articles`.`author` as `author`,
    `writr_articles`.`content` as `content`,
    `writr_articles`.`date` as `date`,
    (select count(*) from `writr_comments` where `writr_comments`.`articleid` = `writr_articles`.`articleid`) as `commentcount`
  from `writr_articles`
  left join
    `writr_categories` on `writr_articles`.`categoryid` = `writr_categories`.`categoryid`
  where
    `writr_articles`.`isdraft` != 1
  order by `writr_articles`.`articleid` desc;


drop view if exists `writr_view_featured`;
create view `writr_view_featured` as
  select
    `writr_view_articles`.*
  from `writr_featured`
  left join
    `writr_view_articles` on `writr_featured`.`articleid` = `writr_view_articles`.`articleid`
  order by `writr_featured`.`order` asc;

/* always create the user editor:letmeinpls with a key*/
INSERT INTO `writr_users` VALUES
  ('editor','$2a$04$OhZlm0BhV43U8VKTrsUoyeT6hhoCr23LRxnhjUH1tnf/5BeZn6F5C','d8d2f1a46829e33c552f2615e89ab73eea487033e6ee0b000b721aee27ad6ab6ec788fae66e9b3c5ee3ee589de10673fae20e2ef32905b9d71cc04df27fd52bc','E','Editor Doe','<i>editor. more or less.</i>','editor@email.com');

/* always insert at least two categories */
INSERT INTO `writr_categories` VALUES
  (1, 'General', 1),
  (2, 'Fiction', 2);
