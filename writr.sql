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

/* sample data? */
INSERT INTO `writr_categories` VALUES (1,'General',1);
INSERT INTO `writr_users` VALUES
  ('editor','$2a$04$OhZlm0BhV43U8VKTrsUoyeT6hhoCr23LRxnhjUH1tnf/5BeZn6F5C','d8d2f1a46829e33c552f2615e89ab73eea487033e6ee0b000b721aee27ad6ab6ec788fae66e9b3c5ee3ee589de10673fae20e2ef32905b9d71cc04df27fd52bc','E','Editor Doe','<i>editor. more or less.</i>','editor@email.com'),
  ('dummy','$2a$04$OhZlm0BhV43U8VKTrsUoyeT6hhoCr23LRxnhjUH1tnf/5BeZn6F5C','d8d2f1a46829e33c552f2615e89ab73eea487033e6ee0b000b721aee27ad6ab6ec788fae66e9b3c5ee3ee589de10673fae20e2ef32905b9d71cc04df27fd52bc','W','Dummy Doe','<i>dummy. more or less.</i>','dummy@email.com');
