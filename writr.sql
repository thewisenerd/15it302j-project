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
    `writr_articles`.`isdraft` as `isdraft`,
    (select count(*) from `writr_comments` where `writr_comments`.`articleid` = `writr_articles`.`articleid`) as `commentcount`
  from `writr_articles`
  left join
    `writr_categories` on `writr_articles`.`categoryid` = `writr_categories`.`categoryid`
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

/* insert these two categories to begin with*/
INSERT INTO `writr_categories` VALUES
  (1, 'General', 1),
  (2, 'Fiction', 2);

/* dummy data. */
INSERT INTO `writr_users` VALUES
  ('dummy0','$2a$04$OfXvFER8MBeKwC1nfTGFI.9FWXjQCG6I4WFT/k44CbUjTtGCHMsIu','4a49d3ac6c4333aba07a4a80786402123db46112a725c1503c2739593cd113ea591d133c31d63cf1e02d31879302dcbcd4422b2d00751230a68b87e4f30d5792','W','Dummy Author #0','This is Dummy Author #0','dummy0@email.com');
INSERT INTO `writr_articles` VALUES (1,1,'Dummy#0 First Article','dummy0','{\"ops\":[{\"insert\":\"This is a test article written by Dummy Author #0. This contains Lorem Ipsum text.\\n\\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Cras quam lectus, mattis vitae dui vitae, imperdiet malesuada sem. Sed finibus mi non felis condimentum, at rutrum neque convallis. Donec consectetur nisi magna, at dignissim augue posuere pharetra. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Vivamus ac luctus arcu, et imperdiet turpis. Phasellus nec convallis libero. Aenean nec lacus facilisis, scelerisque orci nec, scelerisque erat. Pellentesque venenatis vel neque imperdiet facilisis. Maecenas pulvinar purus tortor, ac elementum nunc fringilla ut.\\n\\nUt eget convallis nisi. Phasellus pharetra vel quam in gravida. Curabitur dignissim in velit a rhoncus. Etiam suscipit, augue id dictum pulvinar, erat nulla varius libero, a sagittis massa dui ut tortor. Nunc a ex mi. Quisque nec lacus lorem. Proin ipsum elit, tristique id luctus at, cursus in lorem. Aliquam erat volutpat.\\n\\nVestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Mauris lacinia blandit mauris at varius. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed efficitur, risus tincidunt consequat fringilla, elit nunc eleifend ante, eget commodo massa mauris nec sem. Sed a mollis elit. Nam non porta leo. Donec vulputate quis lectus at semper. Mauris accumsan risus et elementum tincidunt. Etiam accumsan mi suscipit lectus posuere condimentum. Quisque ullamcorper malesuada turpis, et placerat magna volutpat non.\\n\\nMauris eget sagittis augue. Integer consequat ornare ex, at dictum ligula vehicula at. Nulla vitae sodales nisl. Pellentesque pharetra luctus metus quis convallis. Quisque ornare tellus enim, a placerat dui consequat at. Curabitur ultrices eu sapien a consequat. In maximus semper nisl, vitae laoreet velit feugiat et. Nulla volutpat ornare mauris eu finibus. Sed ac ornare dolor. Proin leo libero, posuere sed iaculis non, volutpat vitae dolor.\\n\\nUt ipsum felis, aliquet eget dignissim ac, tempor ut libero. Morbi euismod nec urna vitae auctor. Sed vestibulum eget augue ac pharetra. Ut eu volutpat libero. Cras tincidunt egestas nisi tristique laoreet. Quisque ut elit a tortor suscipit venenatis. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Aenean fermentum tortor risus, a varius sapien ultricies a.\\n\\nThe end? The end.\\n\"}]}','2017-10-16 22:40:52',1);
