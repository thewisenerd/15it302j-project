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
  primary key (`articleid`)

);

/* sample data? */
