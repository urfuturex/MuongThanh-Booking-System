-- ============================================================
--  Mường Thanh Luxury Hotel Management — Database
--  Engine : MariaDB / MySQL 5.7+
--  Charset: utf8mb4 / utf8mb4_unicode_ci
--
--  Cách import trên XAMPP local:
--    1. Mở phpMyAdmin → tạo database mới tên: booking_mt
--    2. Chọn database booking_mt → tab "Nhập" → chọn file này
--    hoặc dùng terminal: mysql -u root < database.sql
--
--  Tài khoản admin mặc định (trang /admin):
--    Email   : lan.nguyen@muongthanh.vn  (Manager)
--    Password: Muongthanh@2026
--  (Tất cả nhân viên mẫu đều dùng mật khẩu này)
-- ============================================================

CREATE DATABASE IF NOT EXISTS `booking_mt`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `booking_mt`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. HOTELS
-- ============================================================
DROP TABLE IF EXISTS `hotels`;
CREATE TABLE `hotels` (
  `id`          int(11)      NOT NULL AUTO_INCREMENT,
  `slug`        varchar(100) NOT NULL,
  `name`        varchar(200) NOT NULL,
  `brand`       enum('luxury','grand','holiday','muongthanh') NOT NULL DEFAULT 'luxury',
  `city`        varchar(100) NOT NULL,
  `province`    varchar(100) NOT NULL,
  `region`      enum('north','central','south') NOT NULL DEFAULT 'north',
  `stars`       tinyint(4)   NOT NULL DEFAULT 4,
  `price`       decimal(15,0) NOT NULL DEFAULT 0 COMMENT 'Giá phòng thấp nhất',
  `rating`      decimal(3,1)  NOT NULL DEFAULT 4.0,
  `reviews`     int(11)       NOT NULL DEFAULT 0,
  `image`       varchar(200)  NOT NULL DEFAULT 'img/hero.png',
  `gallery`     text          NOT NULL DEFAULT '',
  `amenities`   varchar(500)  NOT NULL DEFAULT '',
  `description` text          DEFAULT NULL,
  `lat`         decimal(10,6) DEFAULT NULL,
  `lng`         decimal(10,6) DEFAULT NULL,
  `active`      tinyint(1)    NOT NULL DEFAULT 1,
  `created_at`  timestamp     NOT NULL DEFAULT current_timestamp(),
  `updated_at`  timestamp     NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_brand`  (`brand`),
  KEY `idx_city`   (`city`),
  KEY `idx_region` (`region`),
  KEY `idx_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `hotels` VALUES
(1,'luxury-ha-long','Mường Thanh Luxury Hạ Long Centre','luxury','Hạ Long','Quảng Ninh','north',5,1850000,4.8,1240,'img/halong.png','','pool,spa,gym,restaurant,bar,wifi,parking,beach,conference','Tọa lạc tại vị trí đắc địa ngay trung tâm thành phố Hạ Long, khách sạn mang đến tầm nhìn toàn cảnh vịnh Hạ Long huyền ảo. Với 289 phòng và suite được thiết kế tinh tế, cùng hệ thống tiện ích đẳng cấp 5 sao.',20.958700,107.042800,1,'2026-05-13 14:45:55','2026-05-13 14:45:55'),
(2,'grand-halong','Mường Thanh Grand Hạ Long','grand','Hạ Long','Quảng Ninh','north',4,1200000,4.6,980,'img/halong.png','','pool,restaurant,bar,wifi,parking,conference','Khách sạn 4 sao sang trọng với vị trí trung tâm Hạ Long, gần các điểm tham quan và mua sắm nổi tiếng.',20.961200,107.045200,1,'2026-05-13 14:45:55','2026-05-13 14:45:55'),
(3,'luxury-da-nang','Mường Thanh Luxury Đà Nẵng','luxury','Đà Nẵng','Đà Nẵng','central',5,2100000,4.9,1560,'img/danang.png','','pool,spa,gym,restaurant,bar,wifi,parking,beach','Nằm ngay trên bãi biển Mỹ Khê xanh trong, khách sạn 5 sao với infinity pool hướng biển, spa cao cấp và nhà hàng buffet hải sản tươi sống.',16.054400,108.202200,1,'2026-05-13 14:45:55','2026-05-13 14:45:55'),
(4,'luxury-song-han','Mường Thanh Luxury Sông Hàn','luxury','Đà Nẵng','Đà Nẵng','central',5,1750000,4.7,870,'img/danang.png','','pool,spa,restaurant,bar,wifi,parking','Nhìn ra dòng sông Hàn thơ mộng và cầu Rồng biểu tượng.',16.067800,108.226800,1,'2026-05-13 14:45:55','2026-05-13 14:45:55'),
(5,'sapa','Mường Thanh Sa Pa','muongthanh','Sa Pa','Lào Cai','north',4,980000,4.5,720,'img/sapa.png','','spa,restaurant,bar,wifi,parking','Tọa lạc giữa thiên nhiên hùng vĩ của Sa Pa.',22.336400,103.843800,1,'2026-05-13 14:45:55','2026-05-13 14:45:55'),
(6,'grand-lao-cai','Mường Thanh Grand Lào Cai','grand','Lào Cai','Lào Cai','north',4,850000,4.4,540,'img/sapa.png','','pool,restaurant,wifi,parking,conference','Khách sạn 4 sao tại trung tâm thành phố Lào Cai.',22.485600,103.975500,1,'2026-05-13 14:45:55','2026-05-13 14:45:55'),
(7,'luxury-nha-trang','Mường Thanh Luxury Nha Trang','luxury','Nha Trang','Khánh Hòa','central',5,1950000,4.8,1100,'img/danang.png','','pool,spa,gym,restaurant,bar,wifi,parking,beach','Trực tiếp trên bãi biển Nha Trang xanh ngọc.',12.238800,109.196700,1,'2026-05-13 14:45:55','2026-05-13 14:45:55'),
(8,'grand-nha-trang','Mường Thanh Grand Nha Trang','grand','Nha Trang','Khánh Hòa','central',4,1150000,4.5,760,'img/danang.png','','pool,restaurant,bar,wifi,parking','Khách sạn 4 sao tại trung tâm Nha Trang, cách bãi biển 100m.',12.246100,109.198500,1,'2026-05-13 14:45:55','2026-05-13 14:45:55'),
(9,'grand-ha-noi-centre','Mường Thanh Grand Hà Nội Centre','grand','Hà Nội','Hà Nội','north',4,1350000,4.6,1890,'img/hero.png','','pool,spa,gym,restaurant,bar,wifi,parking,conference','Ngay trung tâm thủ đô Hà Nội.',21.027800,105.834200,1,'2026-05-13 14:45:55','2026-05-13 14:45:55'),
(10,'luxury-saigon','Mường Thanh Luxury Sài Gòn','luxury','Hồ Chí Minh','Hồ Chí Minh','south',5,2300000,4.9,2100,'img/room.png','','pool,spa,gym,restaurant,bar,wifi,parking,conference','Biểu tượng xa xỉ tại trung tâm TP.HCM, tầm nhìn panorama toàn thành phố.',10.776900,106.700900,1,'2026-05-13 14:45:55','2026-05-13 14:45:55'),
(11,'holiday-da-lat','Mường Thanh Holiday Đà Lạt','holiday','Đà Lạt','Lâm Đồng','central',4,890000,4.4,630,'img/sapa.png','','restaurant,bar,wifi,parking,spa','Giữa thành phố ngàn hoa Đà Lạt mộng mơ.',11.940400,108.458300,1,'2026-05-13 14:45:55','2026-05-13 14:45:55'),
(12,'luxury-phu-quoc','Mường Thanh Luxury Phú Quốc','luxury','Phú Quốc','Kiên Giang','south',5,2650000,4.8,980,'img/danang.png','','pool,spa,gym,restaurant,bar,wifi,parking,beach','Thiên đường nhiệt đới trên đảo ngọc Phú Quốc.',10.289900,103.984000,1,'2026-05-13 14:45:55','2026-05-13 14:45:55'),
(13,'luxury-dien-bien','Mường Thanh Luxury Điện Biên','luxury','Điện Biên Phủ','Điện Biên','north',5,1200000,4.6,410,'img/sapa.png','','pool,spa,restaurant,wifi,parking','Khách sạn Luxury tại vùng đất lịch sử Điện Biên Phủ.',21.386000,103.016000,1,'2026-05-13 14:45:55','2026-05-13 14:45:55'),
(14,'holiday-hoi-an','Mường Thanh Holiday Hội An','holiday','Hội An','Quảng Nam','central',4,1050000,4.6,890,'img/danang.png','','pool,spa,restaurant,bar,wifi,parking,beach','Kết hợp phố cổ Hội An và bãi biển An Bàng.',15.880100,108.338000,1,'2026-05-13 14:45:55','2026-05-13 14:45:55'),
(15,'grand-can-tho','Mường Thanh Luxury Cần Thơ','luxury','Cần Thơ','Cần Thơ','south',5,1450000,4.7,560,'img/hero.png','','pool,spa,restaurant,bar,wifi,parking,conference','Soi bóng bên dòng sông Hậu thơ mộng.',10.034100,105.788000,1,'2026-05-13 14:45:55','2026-05-13 14:45:55'),
(16,'holiday-vung-tau','Mường Thanh Holiday Vũng Tàu','holiday','Vũng Tàu','Bà Rịa - Vũng Tàu','south',4,1100000,4.5,740,'img/danang.png','','pool,restaurant,bar,wifi,parking,beach','Chỉ 2 giờ từ TP.HCM, khu nghỉ dưỡng cuối tuần lý tưởng.',10.346000,107.084300,1,'2026-05-13 14:45:55','2026-05-13 14:45:55');

-- ============================================================
-- 2. HOTEL_ROOMS (loại phòng theo khách sạn)
-- ============================================================
DROP TABLE IF EXISTS `hotel_rooms`;
CREATE TABLE `hotel_rooms` (
  `id`        int(11)      NOT NULL AUTO_INCREMENT,
  `hotel_id`  int(11)      NOT NULL,
  `type_name` varchar(100) NOT NULL,
  `price`     decimal(15,0) NOT NULL DEFAULT 0,
  `size`      int(11)       NOT NULL DEFAULT 30 COMMENT 'm²',
  `beds`      varchar(50)   NOT NULL DEFAULT 'King',
  PRIMARY KEY (`id`),
  KEY `hotel_id` (`hotel_id`),
  CONSTRAINT `hotel_rooms_ibfk_1` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `hotel_rooms` VALUES
(1,1,'Deluxe Bay View',1850000,42,'King'),(2,1,'Premier Suite',3200000,68,'King'),(3,1,'Penthouse Suite',6500000,120,'King'),
(4,2,'Superior Room',1200000,35,'Twin/King'),(5,2,'Deluxe Room',1550000,42,'King'),(6,2,'Junior Suite',2400000,65,'King'),
(7,3,'Ocean View Room',2100000,45,'King'),(8,3,'Beach Suite',3800000,75,'King'),(9,3,'Presidential Suite',8500000,150,'King'),
(10,4,'River View Room',1750000,40,'King'),(11,4,'Dragon Bridge Suite',3100000,70,'King'),
(12,5,'Mountain View Room',980000,32,'Twin/King'),(13,5,'Deluxe Mountain Suite',1650000,55,'King'),
(14,6,'Standard Room',850000,30,'Twin/King'),(15,6,'Superior Room',1100000,38,'King'),(16,6,'Suite',1800000,60,'King'),
(17,7,'Sea View Room',1950000,44,'King'),(18,7,'Ocean Suite',3500000,80,'King'),(19,7,'Luxury Villa',7000000,140,'King'),
(20,8,'City View Room',1150000,35,'Twin/King'),(21,8,'Sea View Deluxe',1650000,44,'King'),(22,8,'Family Suite',2800000,90,'Twin+King'),
(23,9,'Superior Room',1350000,36,'Twin/King'),(24,9,'Deluxe Room',1700000,44,'King'),(25,9,'Executive Suite',3200000,75,'King'),
(26,10,'Deluxe City View',2300000,48,'King'),(27,10,'Premier Suite',4500000,90,'King'),(28,10,'Sky Penthouse',9500000,200,'King'),
(29,11,'Garden View Room',890000,32,'Twin/King'),(30,11,'Deluxe Room',1250000,42,'King'),(31,11,'Romance Suite',2100000,65,'King'),
(32,12,'Beach View Room',2650000,50,'King'),(33,12,'Pool Villa',5500000,110,'King'),(34,12,'Overwater Bungalow',9800000,80,'King'),
(35,13,'Deluxe Room',1200000,40,'King'),(36,13,'Heritage Suite',2100000,70,'King'),
(37,14,'Garden Room',1050000,36,'Twin/King'),(38,14,'Pool Access Room',1680000,44,'King'),(39,14,'Ancient Town Suite',2800000,75,'King'),
(40,15,'River View Room',1450000,42,'King'),(41,15,'Riverside Suite',2600000,78,'King'),(42,15,'Premium Suite',4200000,110,'King'),
(43,16,'Sea View Room',1100000,36,'Twin/King'),(44,16,'Beach Suite',2000000,65,'King'),(45,16,'Family Villa',3500000,120,'Twin+King');

-- ============================================================
-- 3. STAFF (tài khoản nhân viên — mật khẩu: Muongthanh@2026)
-- ============================================================
DROP TABLE IF EXISTS `staff`;
CREATE TABLE `staff` (
  `id`            int(11)      NOT NULL AUTO_INCREMENT,
  `hotel_id`      int(11)      DEFAULT NULL,
  `full_name`     varchar(200) NOT NULL,
  `email`         varchar(200) DEFAULT '',
  `password_hash` varchar(255) DEFAULT NULL,
  `phone`         varchar(30)  DEFAULT '',
  `role`          enum('manager','receptionist','housekeeping','concierge','security','other') DEFAULT 'receptionist',
  `active`        tinyint(1)   DEFAULT 1,
  `joined_date`   date         DEFAULT NULL,
  `notes`         text         DEFAULT NULL,
  `created_at`    timestamp    NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `hotel_id` (`hotel_id`),
  CONSTRAINT `staff_ibfk_1` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mật khẩu chung: Muongthanh@2026
INSERT INTO `staff` VALUES
(1,3,'Nguyễn Thị Lan','lan.nguyen@muongthanh.vn','$2y$10$1Go9SQxZQOPAMRsNzjVY5u2ISTxdBX/FuKZdP8CFOakFgqywpbYfa','0901234567','manager',1,'2023-01-15',NULL,'2026-05-13 14:22:25'),
(2,3,'Trần Minh Khoa','khoa.tran@muongthanh.vn','$2y$10$1Go9SQxZQOPAMRsNzjVY5u2ISTxdBX/FuKZdP8CFOakFgqywpbYfa','0912345678','receptionist',1,'2024-03-01',NULL,'2026-05-13 14:22:25'),
(3,3,'Hoàng Thị Mai','mai.hoang@muongthanh.vn','$2y$10$1Go9SQxZQOPAMRsNzjVY5u2ISTxdBX/FuKZdP8CFOakFgqywpbYfa','0934567890','housekeeping',1,'2023-08-20',NULL,'2026-05-13 14:22:25'),
(4,2,'Phạm Văn Hùng','hung.pham@muongthanh.vn','$2y$10$1Go9SQxZQOPAMRsNzjVY5u2ISTxdBX/FuKZdP8CFOakFgqywpbYfa','0923456789','manager',1,'2022-05-10',NULL,'2026-05-13 14:22:25'),
(5,2,'Lê Thị Thu','thu.le@muongthanh.vn','$2y$10$1Go9SQxZQOPAMRsNzjVY5u2ISTxdBX/FuKZdP8CFOakFgqywpbYfa','0945678901','receptionist',1,'2024-01-08',NULL,'2026-05-13 14:22:25'),
(6,10,'Đỗ Văn Nam','nam.do@muongthanh.vn','$2y$10$1Go9SQxZQOPAMRsNzjVY5u2ISTxdBX/FuKZdP8CFOakFgqywpbYfa','0956789012','manager',1,'2021-11-03',NULL,'2026-05-13 14:22:25'),
(7,10,'Bùi Thị Hoa','hoa.bui@muongthanh.vn','$2y$10$1Go9SQxZQOPAMRsNzjVY5u2ISTxdBX/FuKZdP8CFOakFgqywpbYfa','0967890123','concierge',1,'2023-04-15',NULL,'2026-05-13 14:22:25'),
(8,12,'Ngô Minh Tuấn','tuan.ngo@muongthanh.vn','$2y$10$1Go9SQxZQOPAMRsNzjVY5u2ISTxdBX/FuKZdP8CFOakFgqywpbYfa','0978901234','manager',1,'2022-09-01',NULL,'2026-05-13 14:22:25');

-- ============================================================
-- 4. CUSTOMERS
-- ============================================================
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id`            int(11)      NOT NULL AUTO_INCREMENT,
  `email`         varchar(200) NOT NULL,
  `last_name`     varchar(100) NOT NULL DEFAULT '',
  `first_name`    varchar(100) NOT NULL DEFAULT '',
  `phone`         varchar(30)  DEFAULT '',
  `nationality`   varchar(10)  DEFAULT 'VN',
  `vip`           tinyint(1)   DEFAULT 0,
  `notes`         text         DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `created_at`    timestamp    NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `customers` VALUES
(1,'guest.nguyen.van.an@gmail.com','Nguyễn','Văn An','0901111001','VN',0,NULL,NULL,'2026-05-10 08:00:00'),
(2,'guest.tran.thi.bich@gmail.com','Trần','Thị Bích','0902222002','VN',0,NULL,NULL,'2026-05-10 08:00:00'),
(3,'guest.le.van.cuong@gmail.com','Lê','Văn Cường','0903333003','VN',0,NULL,NULL,'2026-05-10 08:00:00'),
(4,'guest.pham.thu.huong@gmail.com','Phạm','Thu Hương','0914408202','VN',0,NULL,NULL,'2026-05-10 08:00:00'),
(5,'guest.do.thi.lan@gmail.com','Đỗ','Thị Lan','0922342753','VN',0,NULL,NULL,'2026-05-10 08:00:00'),
(6,'guest.hoang.thi.mai@gmail.com','Hoàng','Thị Mai','0960796969','KR',1,NULL,NULL,'2026-05-10 08:00:00'),
(7,'guest.le.minh.tuan@gmail.com','Lê','Minh Tuấn','0987970376','VN',0,NULL,NULL,'2026-05-10 08:00:00'),
(8,'guest.hoang.huu.duc@gmail.com','Hoàng','Hữu Đức','0915930444','VN',0,NULL,NULL,'2026-05-10 08:00:00'),
(9,'guest.do.thu.huong2@gmail.com','Đỗ','Thu Hương','0925020498','VN',0,NULL,NULL,'2026-05-10 08:00:00'),
(10,'guest.dang.thi.mai@gmail.com','Đặng','Thị Mai','0972208141','VN',0,NULL,NULL,'2026-05-10 08:00:00');

-- ============================================================
-- 5. BOOKINGS
-- ============================================================
DROP TABLE IF EXISTS `bookings`;
CREATE TABLE `bookings` (
  `id`                  int(11)      NOT NULL AUTO_INCREMENT,
  `ref_code`            varchar(50)  NOT NULL,
  `source`              enum('website','booking_com','traveloka','agoda','hotline','zalo','facebook','other') NOT NULL DEFAULT 'website',
  `external_id`         varchar(100) DEFAULT NULL COMMENT 'ID từ OTA',
  `hotel_slug`          varchar(100) NOT NULL,
  `hotel_name`          varchar(200) NOT NULL,
  `room_type`           varchar(100) NOT NULL,
  `check_in`            date         NOT NULL,
  `check_out`           date         NOT NULL,
  `nights`              tinyint(3) unsigned NOT NULL DEFAULT 1,
  `guests`              tinyint(3) unsigned NOT NULL DEFAULT 1,
  `last_name`           varchar(100) NOT NULL DEFAULT '',
  `first_name`          varchar(100) NOT NULL DEFAULT '',
  `email`               varchar(200) NOT NULL DEFAULT '',
  `phone`               varchar(50)  NOT NULL DEFAULT '',
  `nationality`         varchar(10)  NOT NULL DEFAULT 'VN',
  `special_requests`    text         DEFAULT NULL,
  `extra_breakfast`     tinyint(1)   NOT NULL DEFAULT 0,
  `extra_airport`       tinyint(1)   NOT NULL DEFAULT 0,
  `extra_flowers`       tinyint(1)   NOT NULL DEFAULT 0,
  `extra_spa`           tinyint(1)   NOT NULL DEFAULT 0,
  `payment_method`      varchar(50)  NOT NULL DEFAULT 'card',
  `promo_code`          varchar(50)  DEFAULT NULL,
  `discount_amount`     decimal(15,0) NOT NULL DEFAULT 0,
  `price_per_night`     decimal(15,0) NOT NULL DEFAULT 0,
  `base_total`          decimal(15,0) NOT NULL DEFAULT 0,
  `extras_total`        decimal(15,0) NOT NULL DEFAULT 0,
  `service_fee`         decimal(15,0) NOT NULL DEFAULT 0,
  `grand_total`         decimal(15,0) NOT NULL DEFAULT 0,
  `status`              enum('pending','confirmed','cancelled','checked_in','checked_out','no_show') NOT NULL DEFAULT 'pending',
  `notes`               text         DEFAULT NULL,
  `created_at`          timestamp    NOT NULL DEFAULT current_timestamp(),
  `updated_at`          timestamp    NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ref_code` (`ref_code`),
  KEY `idx_source`     (`source`),
  KEY `idx_status`     (`status`),
  KEY `idx_check_in`   (`check_in`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `bookings` VALUES
-- id, ref_code, source, external_id, hotel_slug, hotel_name, room_type, check_in, check_out, nights, guests,
-- last_name, first_name, email, phone, nationality, special_requests,
-- extra_breakfast, extra_airport, extra_flowers, extra_spa,
-- payment_method, promo_code, discount_amount,
-- price_per_night, base_total, extras_total, service_fee, grand_total, status, notes, created_at, updated_at
(1,'MT-DEMO-00001','website',NULL,'luxury-saigon','Mường Thanh Luxury Sài Gòn','Deluxe City View','2026-05-20','2026-05-22',2,2,'Nguyễn','Văn An','guest.nguyen.van.an@gmail.com','0901111001','VN','',1,0,0,0,'transfer',NULL,0,2300000,4600000,400000,250000,5250000,'confirmed',NULL,'2026-05-13 08:00:00','2026-05-13 08:00:00'),
(2,'MT-DEMO-00002','website',NULL,'luxury-da-nang','Mường Thanh Luxury Đà Nẵng','Ocean View Room','2026-05-21','2026-05-23',2,1,'Trần','Thị Bích','guest.tran.thi.bich@gmail.com','0902222002','VN','',1,0,0,0,'transfer',NULL,0,2100000,4200000,200000,215000,4615000,'confirmed',NULL,'2026-05-13 09:00:00','2026-05-13 09:00:00'),
(3,'MT-BOO-DEMO003','booking_com','BDC-553838','grand-halong','Mường Thanh Grand Hạ Long','Superior Room','2026-05-22','2026-05-24',2,2,'Lê','Văn Cường','guest.le.van.cuong@gmail.com','0903333003','VN','Đặt qua Booking.com',0,0,0,0,'ota',NULL,0,1200000,2400000,0,0,2400000,'confirmed','Đơn tự động từ BOOKING COM','2026-05-13 10:00:00','2026-05-13 10:00:00'),
(4,'MT-BOO-DEMO004','booking_com','BDC-396571','luxury-phu-quoc','Mường Thanh Luxury Phú Quốc','Beach View Room','2026-05-23','2026-05-25',2,2,'Phạm','Thu Hương','guest.pham.thu.huong@gmail.com','0914408202','VN','Đặt qua Booking.com',0,0,0,0,'ota',NULL,0,2650000,5300000,0,0,5300000,'confirmed','Đơn tự động từ BOOKING COM','2026-05-13 11:00:00','2026-05-13 11:00:00'),
(5,'MT-TRA-DEMO005','traveloka','TVL-357949','grand-ha-noi-centre','Mường Thanh Grand Hà Nội Centre','Superior Room','2026-05-24','2026-05-26',2,3,'Đỗ','Thị Lan','guest.do.thi.lan@gmail.com','0922342753','VN','Đặt qua Traveloka App',0,0,0,0,'ota',NULL,0,1350000,2700000,0,0,2700000,'confirmed','Đơn tự động từ TRAVELOKA','2026-05-13 12:00:00','2026-05-13 12:00:00'),
(6,'MT-AGO-DEMO006','agoda','AGD-883790','luxury-phu-quoc','Mường Thanh Luxury Phú Quốc','Overwater Bungalow','2026-05-22','2026-05-24',2,1,'Hoàng','Thị Mai','guest.hoang.thi.mai@gmail.com','0960796969','KR','Booked via Agoda',0,0,0,0,'ota',NULL,0,9800000,19600000,0,0,19600000,'confirmed','Đơn tự động từ AGODA','2026-05-13 13:00:00','2026-05-13 13:00:00'),
(7,'MT-DEMO-00007','hotline',NULL,'grand-lao-cai','Mường Thanh Grand Lào Cai','Standard Room','2026-05-25','2026-05-27',2,2,'Lê','Minh Tuấn','guest.le.minh.tuan@gmail.com','0987970376','VN','',0,0,0,0,'cash',NULL,0,850000,1700000,0,0,1700000,'confirmed','Nhận qua hotline','2026-05-13 14:00:00','2026-05-13 14:00:00'),
(8,'MT-DEMO-00008','zalo',NULL,'luxury-dien-bien','Mường Thanh Luxury Điện Biên','Deluxe Room','2026-05-24','2026-05-26',2,2,'Hoàng','Hữu Đức','guest.hoang.huu.duc@gmail.com','0915930444','VN','',0,0,0,0,'transfer',NULL,0,1200000,2400000,0,0,2400000,'pending','Đặt qua Zalo OA','2026-05-13 15:00:00','2026-05-13 15:00:00'),
(9,'MT-DEMO-00009','facebook',NULL,'holiday-vung-tau','Mường Thanh Holiday Vũng Tàu','Sea View Room','2026-05-26','2026-05-28',2,2,'Đỗ','Thu Hương','guest.do.thu.huong2@gmail.com','0925020498','VN','',0,0,0,0,'cash',NULL,0,1100000,2200000,0,0,2200000,'pending','Đặt qua Facebook Messenger','2026-05-13 16:00:00','2026-05-13 16:00:00'),
(10,'MT-DEMO-00010','website',NULL,'luxury-ha-long','Mường Thanh Luxury Hạ Long Centre','Deluxe Bay View','2026-05-27','2026-05-30',3,2,'Đặng','Thị Mai','guest.dang.thi.mai@gmail.com','0972208141','VN','',1,1,0,1,'card','WELCOME10',500000,1850000,5550000,1250000,340000,7140000,'confirmed',NULL,'2026-05-13 17:00:00','2026-05-13 17:00:00');

-- ============================================================
-- 6. ROOMS (phòng vật lý — trạng thái từng phòng)
-- ============================================================
DROP TABLE IF EXISTS `rooms`;
CREATE TABLE `rooms` (
  `id`                  int(11)      NOT NULL AUTO_INCREMENT,
  `hotel_slug`          varchar(100) NOT NULL,
  `hotel_name`          varchar(200) NOT NULL DEFAULT '',
  `room_number`         varchar(20)  NOT NULL,
  `room_type`           varchar(100) NOT NULL DEFAULT '',
  `floor`               tinyint(3) unsigned DEFAULT NULL,
  `status`              enum('available','occupied','maintenance','blocked') NOT NULL DEFAULT 'available',
  `current_booking_ref` varchar(50)  DEFAULT NULL,
  `notes`               text         DEFAULT NULL,
  `updated_at`          timestamp    NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_hotel_slug` (`hotel_slug`),
  KEY `idx_status`     (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `rooms` (hotel_slug, hotel_name, room_number, room_type, floor, status, current_booking_ref, notes) VALUES
-- Mường Thanh Luxury Hạ Long Centre
('luxury-ha-long','Mường Thanh Luxury Hạ Long Centre','501','Deluxe Bay View',5,'available',NULL,NULL),
('luxury-ha-long','Mường Thanh Luxury Hạ Long Centre','502','Deluxe Bay View',5,'available',NULL,NULL),
('luxury-ha-long','Mường Thanh Luxury Hạ Long Centre','503','Deluxe Bay View',5,'maintenance',NULL,'Sơn phòng'),
('luxury-ha-long','Mường Thanh Luxury Hạ Long Centre','504','Deluxe Bay View',5,'available',NULL,NULL),
('luxury-ha-long','Mường Thanh Luxury Hạ Long Centre','601','Deluxe Bay View',6,'available',NULL,NULL),
('luxury-ha-long','Mường Thanh Luxury Hạ Long Centre','602','Deluxe Bay View',6,'occupied',NULL,NULL),
('luxury-ha-long','Mường Thanh Luxury Hạ Long Centre','603','Deluxe Bay View',6,'available',NULL,NULL),
('luxury-ha-long','Mường Thanh Luxury Hạ Long Centre','604','Deluxe Bay View',6,'available',NULL,NULL),
('luxury-ha-long','Mường Thanh Luxury Hạ Long Centre','1501','Premier Suite',15,'available',NULL,NULL),
('luxury-ha-long','Mường Thanh Luxury Hạ Long Centre','1502','Premier Suite',15,'occupied',NULL,NULL),
('luxury-ha-long','Mường Thanh Luxury Hạ Long Centre','1601','Premier Suite',16,'available',NULL,NULL),
('luxury-ha-long','Mường Thanh Luxury Hạ Long Centre','1602','Premier Suite',16,'available',NULL,NULL),
('luxury-ha-long','Mường Thanh Luxury Hạ Long Centre','2001','Penthouse Suite',20,'available',NULL,NULL),
('luxury-ha-long','Mường Thanh Luxury Hạ Long Centre','2002','Penthouse Suite',20,'blocked',NULL,'Chờ cải tạo'),
-- Mường Thanh Grand Hạ Long
('grand-halong','Mường Thanh Grand Hạ Long','301','Superior Room',3,'available',NULL,NULL),
('grand-halong','Mường Thanh Grand Hạ Long','302','Superior Room',3,'available',NULL,NULL),
('grand-halong','Mường Thanh Grand Hạ Long','303','Superior Room',3,'occupied',NULL,NULL),
('grand-halong','Mường Thanh Grand Hạ Long','304','Superior Room',3,'available',NULL,NULL),
('grand-halong','Mường Thanh Grand Hạ Long','501','Deluxe Room',5,'available',NULL,NULL),
('grand-halong','Mường Thanh Grand Hạ Long','502','Deluxe Room',5,'available',NULL,NULL),
('grand-halong','Mường Thanh Grand Hạ Long','503','Deluxe Room',5,'maintenance',NULL,'Thay thảm'),
('grand-halong','Mường Thanh Grand Hạ Long','504','Deluxe Room',5,'available',NULL,NULL),
('grand-halong','Mường Thanh Grand Hạ Long','801','Junior Suite',8,'available',NULL,NULL),
('grand-halong','Mường Thanh Grand Hạ Long','802','Junior Suite',8,'occupied',NULL,NULL),
-- Mường Thanh Luxury Đà Nẵng
('luxury-da-nang','Mường Thanh Luxury Đà Nẵng','401','Ocean View Room',4,'available',NULL,NULL),
('luxury-da-nang','Mường Thanh Luxury Đà Nẵng','402','Ocean View Room',4,'available',NULL,NULL),
('luxury-da-nang','Mường Thanh Luxury Đà Nẵng','403','Ocean View Room',4,'occupied',NULL,NULL),
('luxury-da-nang','Mường Thanh Luxury Đà Nẵng','404','Ocean View Room',4,'available',NULL,NULL),
('luxury-da-nang','Mường Thanh Luxury Đà Nẵng','1201','Beach Suite',12,'available',NULL,NULL),
('luxury-da-nang','Mường Thanh Luxury Đà Nẵng','1202','Beach Suite',12,'available',NULL,NULL),
('luxury-da-nang','Mường Thanh Luxury Đà Nẵng','3501','Presidential Suite',35,'available',NULL,NULL),
('luxury-da-nang','Mường Thanh Luxury Đà Nẵng','3502','Presidential Suite',35,'blocked',NULL,'VIP reservation'),
-- Mường Thanh Luxury Sông Hàn
('luxury-song-han','Mường Thanh Luxury Sông Hàn','301','River View Room',3,'available',NULL,NULL),
('luxury-song-han','Mường Thanh Luxury Sông Hàn','302','River View Room',3,'available',NULL,NULL),
('luxury-song-han','Mường Thanh Luxury Sông Hàn','303','River View Room',3,'occupied',NULL,NULL),
('luxury-song-han','Mường Thanh Luxury Sông Hàn','304','River View Room',3,'available',NULL,NULL),
('luxury-song-han','Mường Thanh Luxury Sông Hàn','401','River View Room',4,'available',NULL,NULL),
('luxury-song-han','Mường Thanh Luxury Sông Hàn','402','River View Room',4,'maintenance',NULL,'Sửa điều hòa'),
('luxury-song-han','Mường Thanh Luxury Sông Hàn','403','River View Room',4,'available',NULL,NULL),
('luxury-song-han','Mường Thanh Luxury Sông Hàn','404','River View Room',4,'available',NULL,NULL),
('luxury-song-han','Mường Thanh Luxury Sông Hàn','1201','Dragon Bridge Suite',12,'available',NULL,NULL),
('luxury-song-han','Mường Thanh Luxury Sông Hàn','1202','Dragon Bridge Suite',12,'occupied',NULL,NULL),
('luxury-song-han','Mường Thanh Luxury Sông Hàn','1301','Dragon Bridge Suite',13,'available',NULL,NULL),
('luxury-song-han','Mường Thanh Luxury Sông Hàn','1302','Dragon Bridge Suite',13,'available',NULL,NULL),
-- Mường Thanh Sa Pa
('sapa','Mường Thanh Sa Pa','201','Mountain View Room',2,'available',NULL,NULL),
('sapa','Mường Thanh Sa Pa','202','Mountain View Room',2,'available',NULL,NULL),
('sapa','Mường Thanh Sa Pa','203','Mountain View Room',2,'occupied',NULL,NULL),
('sapa','Mường Thanh Sa Pa','301','Mountain View Room',3,'available',NULL,NULL),
('sapa','Mường Thanh Sa Pa','302','Mountain View Room',3,'available',NULL,NULL),
('sapa','Mường Thanh Sa Pa','303','Mountain View Room',3,'available',NULL,NULL),
('sapa','Mường Thanh Sa Pa','501','Deluxe Mountain Suite',5,'available',NULL,NULL),
('sapa','Mường Thanh Sa Pa','502','Deluxe Mountain Suite',5,'available',NULL,NULL),
('sapa','Mường Thanh Sa Pa','601','Deluxe Mountain Suite',6,'available',NULL,NULL),
('sapa','Mường Thanh Sa Pa','602','Deluxe Mountain Suite',6,'maintenance',NULL,'Sơn tường'),
-- Mường Thanh Grand Lào Cai
('grand-lao-cai','Mường Thanh Grand Lào Cai','201','Standard Room',2,'available',NULL,NULL),
('grand-lao-cai','Mường Thanh Grand Lào Cai','202','Standard Room',2,'available',NULL,NULL),
('grand-lao-cai','Mường Thanh Grand Lào Cai','203','Standard Room',2,'available',NULL,NULL),
('grand-lao-cai','Mường Thanh Grand Lào Cai','204','Standard Room',2,'occupied',NULL,NULL),
('grand-lao-cai','Mường Thanh Grand Lào Cai','301','Standard Room',3,'available',NULL,NULL),
('grand-lao-cai','Mường Thanh Grand Lào Cai','302','Standard Room',3,'available',NULL,NULL),
('grand-lao-cai','Mường Thanh Grand Lào Cai','401','Superior Room',4,'available',NULL,NULL),
('grand-lao-cai','Mường Thanh Grand Lào Cai','402','Superior Room',4,'available',NULL,NULL),
('grand-lao-cai','Mường Thanh Grand Lào Cai','403','Superior Room',4,'available',NULL,NULL),
('grand-lao-cai','Mường Thanh Grand Lào Cai','404','Superior Room',4,'maintenance',NULL,'Bảo trì thiết bị'),
('grand-lao-cai','Mường Thanh Grand Lào Cai','801','Suite',8,'available',NULL,NULL),
('grand-lao-cai','Mường Thanh Grand Lào Cai','802','Suite',8,'occupied',NULL,NULL),
-- Mường Thanh Luxury Nha Trang
('luxury-nha-trang','Mường Thanh Luxury Nha Trang','501','Sea View Room',5,'available',NULL,NULL),
('luxury-nha-trang','Mường Thanh Luxury Nha Trang','502','Sea View Room',5,'available',NULL,NULL),
('luxury-nha-trang','Mường Thanh Luxury Nha Trang','503','Sea View Room',5,'occupied',NULL,NULL),
('luxury-nha-trang','Mường Thanh Luxury Nha Trang','504','Sea View Room',5,'available',NULL,NULL),
('luxury-nha-trang','Mường Thanh Luxury Nha Trang','601','Sea View Room',6,'available',NULL,NULL),
('luxury-nha-trang','Mường Thanh Luxury Nha Trang','602','Sea View Room',6,'available',NULL,NULL),
('luxury-nha-trang','Mường Thanh Luxury Nha Trang','603','Sea View Room',6,'available',NULL,NULL),
('luxury-nha-trang','Mường Thanh Luxury Nha Trang','604','Sea View Room',6,'maintenance',NULL,'Thay đệm'),
('luxury-nha-trang','Mường Thanh Luxury Nha Trang','2001','Ocean Suite',20,'available',NULL,NULL),
('luxury-nha-trang','Mường Thanh Luxury Nha Trang','2002','Ocean Suite',20,'available',NULL,NULL),
('luxury-nha-trang','Mường Thanh Luxury Nha Trang','2101','Ocean Suite',21,'occupied',NULL,NULL),
('luxury-nha-trang','Mường Thanh Luxury Nha Trang','2102','Ocean Suite',21,'available',NULL,NULL),
('luxury-nha-trang','Mường Thanh Luxury Nha Trang','V01','Luxury Villa',1,'available',NULL,NULL),
('luxury-nha-trang','Mường Thanh Luxury Nha Trang','V02','Luxury Villa',1,'occupied',NULL,NULL),
-- Mường Thanh Grand Nha Trang
('grand-nha-trang','Mường Thanh Grand Nha Trang','301','City View Room',3,'available',NULL,NULL),
('grand-nha-trang','Mường Thanh Grand Nha Trang','302','City View Room',3,'available',NULL,NULL),
('grand-nha-trang','Mường Thanh Grand Nha Trang','303','City View Room',3,'occupied',NULL,NULL),
('grand-nha-trang','Mường Thanh Grand Nha Trang','304','City View Room',3,'available',NULL,NULL),
('grand-nha-trang','Mường Thanh Grand Nha Trang','601','Sea View Deluxe',6,'available',NULL,NULL),
('grand-nha-trang','Mường Thanh Grand Nha Trang','602','Sea View Deluxe',6,'available',NULL,NULL),
('grand-nha-trang','Mường Thanh Grand Nha Trang','603','Sea View Deluxe',6,'available',NULL,NULL),
('grand-nha-trang','Mường Thanh Grand Nha Trang','604','Sea View Deluxe',6,'maintenance',NULL,'Sơn lại tường'),
('grand-nha-trang','Mường Thanh Grand Nha Trang','1001','Family Suite',10,'available',NULL,NULL),
('grand-nha-trang','Mường Thanh Grand Nha Trang','1002','Family Suite',10,'occupied',NULL,NULL),
-- Mường Thanh Grand Hà Nội Centre
('grand-ha-noi-centre','Mường Thanh Grand Hà Nội Centre','301','Superior Room',3,'available',NULL,NULL),
('grand-ha-noi-centre','Mường Thanh Grand Hà Nội Centre','302','Superior Room',3,'available',NULL,NULL),
('grand-ha-noi-centre','Mường Thanh Grand Hà Nội Centre','303','Superior Room',3,'occupied',NULL,NULL),
('grand-ha-noi-centre','Mường Thanh Grand Hà Nội Centre','304','Superior Room',3,'available',NULL,NULL),
('grand-ha-noi-centre','Mường Thanh Grand Hà Nội Centre','601','Deluxe Room',6,'available',NULL,NULL),
('grand-ha-noi-centre','Mường Thanh Grand Hà Nội Centre','602','Deluxe Room',6,'available',NULL,NULL),
('grand-ha-noi-centre','Mường Thanh Grand Hà Nội Centre','603','Deluxe Room',6,'maintenance',NULL,'Bảo trì điện'),
('grand-ha-noi-centre','Mường Thanh Grand Hà Nội Centre','604','Deluxe Room',6,'available',NULL,NULL),
('grand-ha-noi-centre','Mường Thanh Grand Hà Nội Centre','1501','Executive Suite',15,'available',NULL,NULL),
('grand-ha-noi-centre','Mường Thanh Grand Hà Nội Centre','1502','Executive Suite',15,'occupied',NULL,NULL),
-- Mường Thanh Luxury Sài Gòn
('luxury-saigon','Mường Thanh Luxury Sài Gòn','601','Deluxe City View',6,'available',NULL,NULL),
('luxury-saigon','Mường Thanh Luxury Sài Gòn','602','Deluxe City View',6,'available',NULL,NULL),
('luxury-saigon','Mường Thanh Luxury Sài Gòn','603','Deluxe City View',6,'occupied',NULL,NULL),
('luxury-saigon','Mường Thanh Luxury Sài Gòn','604','Deluxe City View',6,'available',NULL,NULL),
('luxury-saigon','Mường Thanh Luxury Sài Gòn','701','Deluxe City View',7,'available',NULL,NULL),
('luxury-saigon','Mường Thanh Luxury Sài Gòn','702','Deluxe City View',7,'available',NULL,NULL),
('luxury-saigon','Mường Thanh Luxury Sài Gòn','2001','Premier Suite',20,'available',NULL,NULL),
('luxury-saigon','Mường Thanh Luxury Sài Gòn','2002','Premier Suite',20,'occupied',NULL,NULL),
('luxury-saigon','Mường Thanh Luxury Sài Gòn','2101','Premier Suite',21,'available',NULL,NULL),
('luxury-saigon','Mường Thanh Luxury Sài Gòn','2102','Premier Suite',21,'available',NULL,NULL),
('luxury-saigon','Mường Thanh Luxury Sài Gòn','3501','Sky Penthouse',35,'available',NULL,NULL),
('luxury-saigon','Mường Thanh Luxury Sài Gòn','3502','Sky Penthouse',35,'blocked',NULL,'Chờ cải tạo'),
-- Mường Thanh Holiday Đà Lạt
('holiday-da-lat','Mường Thanh Holiday Đà Lạt','201','Garden View Room',2,'available',NULL,NULL),
('holiday-da-lat','Mường Thanh Holiday Đà Lạt','202','Garden View Room',2,'available',NULL,NULL),
('holiday-da-lat','Mường Thanh Holiday Đà Lạt','203','Garden View Room',2,'occupied',NULL,NULL),
('holiday-da-lat','Mường Thanh Holiday Đà Lạt','204','Garden View Room',2,'available',NULL,NULL),
('holiday-da-lat','Mường Thanh Holiday Đà Lạt','401','Deluxe Room',4,'available',NULL,NULL),
('holiday-da-lat','Mường Thanh Holiday Đà Lạt','402','Deluxe Room',4,'available',NULL,NULL),
('holiday-da-lat','Mường Thanh Holiday Đà Lạt','403','Deluxe Room',4,'available',NULL,NULL),
('holiday-da-lat','Mường Thanh Holiday Đà Lạt','404','Deluxe Room',4,'maintenance',NULL,'Sửa cửa sổ'),
('holiday-da-lat','Mường Thanh Holiday Đà Lạt','701','Romance Suite',7,'available',NULL,NULL),
('holiday-da-lat','Mường Thanh Holiday Đà Lạt','702','Romance Suite',7,'occupied',NULL,NULL),
-- Mường Thanh Luxury Phú Quốc
('luxury-phu-quoc','Mường Thanh Luxury Phú Quốc','201','Beach View Room',2,'available',NULL,NULL),
('luxury-phu-quoc','Mường Thanh Luxury Phú Quốc','202','Beach View Room',2,'available',NULL,NULL),
('luxury-phu-quoc','Mường Thanh Luxury Phú Quốc','203','Beach View Room',2,'occupied',NULL,NULL),
('luxury-phu-quoc','Mường Thanh Luxury Phú Quốc','204','Beach View Room',2,'available',NULL,NULL),
('luxury-phu-quoc','Mường Thanh Luxury Phú Quốc','PV01','Pool Villa',1,'available',NULL,NULL),
('luxury-phu-quoc','Mường Thanh Luxury Phú Quốc','PV02','Pool Villa',1,'available',NULL,NULL),
('luxury-phu-quoc','Mường Thanh Luxury Phú Quốc','PV03','Pool Villa',1,'occupied',NULL,NULL),
('luxury-phu-quoc','Mường Thanh Luxury Phú Quốc','OB01','Overwater Bungalow',1,'available',NULL,NULL),
('luxury-phu-quoc','Mường Thanh Luxury Phú Quốc','OB02','Overwater Bungalow',1,'occupied',NULL,NULL),
-- Mường Thanh Luxury Điện Biên
('luxury-dien-bien','Mường Thanh Luxury Điện Biên','201','Deluxe Room',2,'available',NULL,NULL),
('luxury-dien-bien','Mường Thanh Luxury Điện Biên','202','Deluxe Room',2,'available',NULL,NULL),
('luxury-dien-bien','Mường Thanh Luxury Điện Biên','203','Deluxe Room',2,'occupied',NULL,NULL),
('luxury-dien-bien','Mường Thanh Luxury Điện Biên','204','Deluxe Room',2,'available',NULL,NULL),
('luxury-dien-bien','Mường Thanh Luxury Điện Biên','301','Deluxe Room',3,'available',NULL,NULL),
('luxury-dien-bien','Mường Thanh Luxury Điện Biên','302','Deluxe Room',3,'maintenance',NULL,'Thay đèn'),
('luxury-dien-bien','Mường Thanh Luxury Điện Biên','601','Heritage Suite',6,'available',NULL,NULL),
('luxury-dien-bien','Mường Thanh Luxury Điện Biên','602','Heritage Suite',6,'available',NULL,NULL),
-- Mường Thanh Holiday Hội An
('holiday-hoi-an','Mường Thanh Holiday Hội An','101','Garden Room',1,'available',NULL,NULL),
('holiday-hoi-an','Mường Thanh Holiday Hội An','102','Garden Room',1,'available',NULL,NULL),
('holiday-hoi-an','Mường Thanh Holiday Hội An','103','Garden Room',1,'occupied',NULL,NULL),
('holiday-hoi-an','Mường Thanh Holiday Hội An','104','Garden Room',1,'available',NULL,NULL),
('holiday-hoi-an','Mường Thanh Holiday Hội An','201','Pool Access Room',2,'available',NULL,NULL),
('holiday-hoi-an','Mường Thanh Holiday Hội An','202','Pool Access Room',2,'available',NULL,NULL),
('holiday-hoi-an','Mường Thanh Holiday Hội An','203','Pool Access Room',2,'available',NULL,NULL),
('holiday-hoi-an','Mường Thanh Holiday Hội An','204','Pool Access Room',2,'maintenance',NULL,'Sơn lại'),
('holiday-hoi-an','Mường Thanh Holiday Hội An','501','Ancient Town Suite',5,'available',NULL,NULL),
('holiday-hoi-an','Mường Thanh Holiday Hội An','502','Ancient Town Suite',5,'occupied',NULL,NULL),
-- Mường Thanh Luxury Cần Thơ
('grand-can-tho','Mường Thanh Luxury Cần Thơ','301','River View Room',3,'available',NULL,NULL),
('grand-can-tho','Mường Thanh Luxury Cần Thơ','302','River View Room',3,'available',NULL,NULL),
('grand-can-tho','Mường Thanh Luxury Cần Thơ','303','River View Room',3,'occupied',NULL,NULL),
('grand-can-tho','Mường Thanh Luxury Cần Thơ','304','River View Room',3,'available',NULL,NULL),
('grand-can-tho','Mường Thanh Luxury Cần Thơ','801','Riverside Suite',8,'available',NULL,NULL),
('grand-can-tho','Mường Thanh Luxury Cần Thơ','802','Riverside Suite',8,'available',NULL,NULL),
('grand-can-tho','Mường Thanh Luxury Cần Thơ','1201','Premium Suite',12,'available',NULL,NULL),
('grand-can-tho','Mường Thanh Luxury Cần Thơ','1202','Premium Suite',12,'occupied',NULL,NULL),
-- Mường Thanh Holiday Vũng Tàu
('holiday-vung-tau','Mường Thanh Holiday Vũng Tàu','201','Sea View Room',2,'available',NULL,NULL),
('holiday-vung-tau','Mường Thanh Holiday Vũng Tàu','202','Sea View Room',2,'available',NULL,NULL),
('holiday-vung-tau','Mường Thanh Holiday Vũng Tàu','203','Sea View Room',2,'occupied',NULL,NULL),
('holiday-vung-tau','Mường Thanh Holiday Vũng Tàu','204','Sea View Room',2,'available',NULL,NULL),
('holiday-vung-tau','Mường Thanh Holiday Vũng Tàu','501','Beach Suite',5,'available',NULL,NULL),
('holiday-vung-tau','Mường Thanh Holiday Vũng Tàu','502','Beach Suite',5,'available',NULL,NULL),
('holiday-vung-tau','Mường Thanh Holiday Vũng Tàu','503','Beach Suite',5,'maintenance',NULL,'Thay thảm'),
('holiday-vung-tau','Mường Thanh Holiday Vũng Tàu','FV01','Family Villa',1,'available',NULL,NULL),
('holiday-vung-tau','Mường Thanh Holiday Vũng Tàu','FV02','Family Villa',1,'occupied',NULL,NULL);

-- ============================================================
-- 7. PROMOTIONS
-- ============================================================
DROP TABLE IF EXISTS `promotions`;
CREATE TABLE `promotions` (
  `id`             int(11)      NOT NULL AUTO_INCREMENT,
  `code`           varchar(50)  NOT NULL,
  `name`           varchar(200) NOT NULL,
  `discount_type`  enum('percent','fixed') DEFAULT 'percent',
  `discount_value` decimal(10,2) NOT NULL DEFAULT 10.00,
  `min_nights`     int(11)       DEFAULT 1,
  `min_total`      decimal(15,0) DEFAULT 0,
  `applies_to`     enum('all','luxury','grand','holiday','muongthanh') DEFAULT 'all',
  `valid_from`     date          DEFAULT NULL,
  `valid_to`       date          DEFAULT NULL,
  `usage_limit`    int(11)       DEFAULT 0 COMMENT '0=unlimited',
  `used_count`     int(11)       DEFAULT 0,
  `active`         tinyint(1)    DEFAULT 1,
  `created_at`     timestamp     NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `promotions` VALUES
(1,'WELCOME10','Chào mừng khách mới','percent',10.00,1,0,'all','2026-01-01','2026-12-31',0,0,1,'2026-05-13 14:22:25'),
(2,'SUMMER20','Ưu đãi hè 2026','percent',20.00,2,0,'all','2026-06-01','2026-08-31',0,0,1,'2026-05-13 14:22:25'),
(3,'LUXURY500K','Giảm 500K khách sạn Luxury','fixed',500000.00,3,0,'luxury','2026-01-01','2026-12-31',0,0,1,'2026-05-13 14:22:25'),
(4,'WEEKEND15','Cuối tuần giảm 15%','percent',15.00,2,0,'all','2026-01-01','2026-12-31',0,0,1,'2026-05-13 14:22:25');

-- ============================================================
-- 8. REVIEWS
-- ============================================================
DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews` (
  `id`             int(11)      NOT NULL AUTO_INCREMENT,
  `hotel_id`       int(11)      NOT NULL,
  `booking_ref`    varchar(50)  DEFAULT '',
  `customer_name`  varchar(200) DEFAULT '',
  `customer_email` varchar(200) DEFAULT '',
  `rating`         tinyint(4)   NOT NULL DEFAULT 5,
  `title`          varchar(300) DEFAULT '',
  `comment`        text         DEFAULT NULL,
  `status`         enum('pending','approved','rejected') DEFAULT 'pending',
  `reply`          text         DEFAULT NULL,
  `created_at`     timestamp    NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_hotel`  (`hotel_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `reviews` VALUES
(1,3,'MT-DEMO-00002','Trần Thị Bích','guest.tran.thi.bich@gmail.com',5,'Tuyệt vời!','Phòng rộng, view biển đẹp. Nhân viên thân thiện và chuyên nghiệp. Sẽ quay lại!','approved',NULL,'2026-05-14 08:00:00'),
(2,3,'','Nguyễn Văn An','guest.nguyen.van.an@gmail.com',4,'Rất hài lòng','Vị trí đắc địa, bãi biển sạch. Bữa sáng buffet phong phú.','approved','Cảm ơn quý khách đã tin tưởng lựa chọn!','2026-05-14 09:00:00'),
(3,2,'MT-BOO-DEMO003','Lê Văn Cường','guest.le.van.cuong@gmail.com',3,'Tạm được','Phòng ổn nhưng wifi chập chờn. Nhân viên check-in hơi chậm.','pending',NULL,'2026-05-14 10:00:00'),
(4,12,'','Phạm Minh Đức','guest.pham.thu.huong@gmail.com',5,'Hoàn hảo','Kỳ nghỉ tuyệt vời cùng gia đình. Hồ bơi rất đẹp.','approved',NULL,'2026-05-14 11:00:00'),
(5,5,'','Vũ Thị Lan','guest.le.minh.tuan@gmail.com',2,'Thất vọng','Phòng không khớp ảnh quảng cáo, điều hòa bị lỗi.','pending',NULL,'2026-05-14 12:00:00');

-- ============================================================
-- 9. EXTRAS (dịch vụ thêm)
-- ============================================================
DROP TABLE IF EXISTS `extras`;
CREATE TABLE `extras` (
  `id`         int(11)     NOT NULL AUTO_INCREMENT,
  `code`       varchar(50) NOT NULL,
  `name_vi`    varchar(200) NOT NULL,
  `icon`       varchar(20)  DEFAULT '',
  `price`      decimal(15,0) NOT NULL DEFAULT 0,
  `calc_type`  enum('flat','per_person','per_night','per_person_per_night') DEFAULT 'flat',
  `note`       varchar(200) DEFAULT '',
  `is_active`  tinyint(1)   DEFAULT 1,
  `sort_order` int(11)      DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `extras` VALUES
(1,'breakfast','Bữa sáng cao cấp','🍳',200000,'per_person_per_night','+200.000đ/người/ngày',1,1),
(2,'airport','Đưa đón sân bay','🚗',350000,'flat','+350.000đ/lượt',1,2),
(3,'flowers','Trang trí phòng lãng mạn','💐',500000,'flat','+500.000đ',1,3),
(4,'spa','Gói Spa 60 phút','💆',650000,'per_person','+650.000đ/người',1,4);

-- ============================================================
-- 10. PAYMENT_METHODS
-- ============================================================
DROP TABLE IF EXISTS `payment_methods`;
CREATE TABLE `payment_methods` (
  `id`          int(11)     NOT NULL AUTO_INCREMENT,
  `code`        varchar(30) NOT NULL,
  `name_vi`     varchar(80) NOT NULL,
  `description` text        DEFAULT NULL,
  `is_active`   tinyint(1)  NOT NULL DEFAULT 1,
  `sort_order`  int(11)     NOT NULL DEFAULT 0,
  `created_at`  timestamp   NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `payment_methods` VALUES
(1,'cash','Tiền mặt','Thanh toán trực tiếp tại quầy lễ tân',1,1,NOW()),
(2,'card','Thẻ ngân hàng','Thẻ Visa / Mastercard / JCB / nội địa',1,2,NOW()),
(3,'bank_transfer','Chuyển khoản ngân hàng','Chuyển khoản qua tài khoản ngân hàng',1,3,NOW()),
(4,'momo','Ví MoMo','Thanh toán qua ứng dụng MoMo',1,4,NOW()),
(5,'vnpay','VNPay','Cổng thanh toán VNPay',1,5,NOW());

-- ============================================================
-- 11. PAYMENTS (giao dịch thanh toán)
-- ============================================================
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id`         int(11)     NOT NULL AUTO_INCREMENT,
  `ref_code`   varchar(50) NOT NULL,
  `booking_id` int(11)     DEFAULT NULL,
  `type`       enum('deposit','balance','full','refund','other') NOT NULL DEFAULT 'deposit',
  `amount`     decimal(15,0) NOT NULL DEFAULT 0,
  `method`     varchar(30)   NOT NULL DEFAULT 'cash',
  `status`     enum('pending','paid','refunded','failed') NOT NULL DEFAULT 'pending',
  `note`       text          DEFAULT NULL,
  `paid_at`    timestamp     NULL DEFAULT NULL,
  `created_at` timestamp     NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_ref`    (`ref_code`),
  KEY `idx_status` (`status`),
  KEY `idx_date`   (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `payments` VALUES
(1,'MT-PAY-00001',1,'full',5250000,'bank_transfer','paid','Thanh toán online',NOW(),NOW()),
(2,'MT-PAY-00002',2,'full',4615000,'bank_transfer','paid','Thanh toán online',NOW(),NOW()),
(3,'MT-PAY-00003',3,'full',2400000,'ota','paid','Thu qua Booking.com',NOW(),NOW());

-- ============================================================
-- 12. SETTINGS (cấu hình hệ thống)
-- ============================================================
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `key`   varchar(100) NOT NULL,
  `value` varchar(500) NOT NULL DEFAULT '',
  `label` varchar(200) DEFAULT '',
  `type`  enum('text','number','boolean') DEFAULT 'text',
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `settings` VALUES
('hotel_name',      'Mường Thanh',              'Tên chuỗi khách sạn',              'text'),
('support_email',   'info@muongthanh.com',       'Email hỗ trợ',                     'text'),
('support_phone',   '1800 1234',                 'Số điện thoại hỗ trợ',             'text'),
('service_fee_pct', '5',                         'Phí dịch vụ (%)',                  'number'),
('max_price_filter','10000000',                  'Giá tối đa bộ lọc tìm kiếm (đ)',  'number'),
('smtp_host',       'smtp.gmail.com',            'SMTP Host',                        'text'),
('smtp_port',       '587',                       'SMTP Port',                        'number'),
('smtp_user',       'muongthanh.info@gmail.com', 'SMTP Username',                    'text'),
('smtp_pass',       '',                          'SMTP Password (App Password)',      'text'),
('smtp_from_name',  'Mường Thanh',              'Tên người gửi email',              'text'),
('momo_phone',       '',                          'Số điện thoại MoMo',               'text'),
('momo_account_name','',                          'Tên tài khoản MoMo',               'text'),
('vnpay_tmn_code',   '',                          'VNPay Terminal Code (TmnCode)',     'text'),
('vnpay_hash_secret','',                          'VNPay Hash Secret',                'text'),
('vnpay_sandbox',    '1',                         'VNPay Sandbox mode (1=test, 0=live)','number');

-- ============================================================
-- 13. EMAIL_TEMPLATES
-- ============================================================
DROP TABLE IF EXISTS `email_templates`;
CREATE TABLE `email_templates` (
  `id`         int(11)      NOT NULL AUTO_INCREMENT,
  `code`       varchar(50)  NOT NULL,
  `name`       varchar(200) NOT NULL,
  `subject`    varchar(300) NOT NULL DEFAULT '',
  `blocks`     text         NOT NULL DEFAULT '[]',
  `is_active`  tinyint(1)   NOT NULL DEFAULT 1,
  `updated_at` timestamp    NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `email_templates` (`code`, `name`, `subject`, `blocks`, `is_active`) VALUES
('booking_confirmed', 'Xác nhận đặt phòng', 'Xác nhận đặt phòng #{{ref_code}} — Mường Thanh',
 '[{"type":"heading","content":"Đặt phòng thành công!"},{"type":"text","content":"Xin chào {{first_name}} {{last_name}},<br>Chúng tôi đã nhận được đặt phòng của bạn. Dưới đây là thông tin chi tiết:"},{"type":"text","content":"<b>Mã đặt phòng:</b> {{ref_code}}<br><b>Khách sạn:</b> {{hotel_name}}<br><b>Loại phòng:</b> {{room_type}}<br><b>Check-in:</b> {{check_in}}<br><b>Check-out:</b> {{check_out}}"},{"type":"text","content":"Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ chúng tôi qua hotline 1800 1234."},{"type":"text","content":"Trân trọng,<br><b>Mường Thanh Hotel Group</b>"}]',
 1),
('booking_cancelled', 'Thông báo hủy đặt phòng', 'Hủy đặt phòng #{{ref_code}} — Mường Thanh',
 '[{"type":"heading","content":"Đặt phòng đã được hủy"},{"type":"text","content":"Xin chào {{first_name}} {{last_name}},<br>Đặt phòng <b>#{{ref_code}}</b> của bạn đã được hủy thành công."},{"type":"text","content":"Nếu bạn có câu hỏi về hoàn tiền hoặc cần hỗ trợ, vui lòng liên hệ 1800 1234."},{"type":"text","content":"Trân trọng,<br><b>Mường Thanh Hotel Group</b>"}]',
 1),
('booking_reminder', 'Nhắc nhở check-in', 'Nhắc lịch check-in ngày mai — Mường Thanh',
 '[{"type":"heading","content":"Nhắc nhở check-in"},{"type":"text","content":"Xin chào {{first_name}} {{last_name}},<br>Chúng tôi xin nhắc bạn về lịch check-in vào ngày mai:"},{"type":"text","content":"<b>Khách sạn:</b> {{hotel_name}}<br><b>Check-in:</b> {{check_in}}<br><b>Mã đặt phòng:</b> {{ref_code}}"},{"type":"text","content":"Giờ nhận phòng tiêu chuẩn: 14:00. Nếu bạn muốn early check-in, vui lòng liên hệ trước."},{"type":"text","content":"Trân trọng,<br><b>Mường Thanh Hotel Group</b>"}]',
 1);

-- ============================================================
-- 14. PASSWORD_RESETS (mã OTP quên mật khẩu)
-- ============================================================
DROP TABLE IF EXISTS `password_resets`;
CREATE TABLE `password_resets` (
  `id`         int(11)      NOT NULL AUTO_INCREMENT,
  `email`      varchar(255) NOT NULL,
  `code`       char(6)      NOT NULL,
  `expires_at` datetime     NOT NULL,
  `used`       tinyint(1)   NOT NULL DEFAULT 0,
  `created_at` timestamp    NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
SET FOREIGN_KEY_CHECKS = 1;
-- ============================================================
-- Import xong! Truy cập:
--   Web      : http://localhost/booking.mt/
--   Admin    : http://localhost/booking.mt/admin/
--   Login    : lan.nguyen@muongthanh.vn / Muongthanh@2026
-- ============================================================
