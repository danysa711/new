-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Sep 01, 2025 at 10:01 PM
-- Server version: 10.11.6-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_shopee_bot`
--

-- --------------------------------------------------------

--
-- Table structure for table `Licenses`
--

CREATE TABLE `Licenses` (
  `id` int(11) NOT NULL,
  `software_id` int(11) NOT NULL,
  `software_version_id` int(11) DEFAULT NULL,
  `license_key` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `used_at` datetime DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `Licenses`
--

INSERT INTO `Licenses` (`id`, `software_id`, `software_version_id`, `license_key`, `is_active`, `used_at`, `user_id`, `createdAt`, `updatedAt`) VALUES
(14, 25, NULL, '1231', 0, NULL, NULL, '2025-08-30 07:32:55', '2025-08-30 07:32:55'),
(15, 26, NULL, '4ab9437ad47a', 1, '2025-09-01 10:17:12', 41, '2025-08-30 07:43:06', '2025-09-01 10:17:12'),
(16, 27, 19, 'c847dff72cc2', 0, NULL, 41, '2025-08-30 07:53:56', '2025-08-30 07:53:56'),
(17, 28, 20, 'df3011d54933', 0, NULL, 42, '2025-08-30 07:55:33', '2025-08-30 07:55:33'),
(18, 29, NULL, 'da17e714e6c9', 1, '2025-09-01 11:07:00', 42, '2025-08-30 12:39:20', '2025-09-01 11:07:00'),
(19, 30, NULL, 'b85f968923e4', 0, '2025-09-01 12:06:59', 42, '2025-08-30 12:48:42', '2025-09-01 12:07:48'),
(20, 31, NULL, '972364cbf5d7', 0, '2025-09-01 12:10:20', 41, '2025-08-30 12:49:43', '2025-09-01 12:10:36'),
(36, 27, 25, '09f2546546c8', 0, '2025-08-30 14:13:54', 41, '2025-08-30 14:07:34', '2025-08-31 10:01:40'),
(37, 28, 26, '09f2546546c82', 0, '2025-08-30 14:11:06', 42, '2025-08-30 14:08:33', '2025-08-30 14:13:17'),
(39, 33, NULL, '11111111111', 0, NULL, 41, '2025-09-01 07:10:00', '2025-09-01 07:10:00'),
(40, 34, NULL, '22222222222222', 0, NULL, 42, '2025-09-01 07:11:23', '2025-09-01 07:11:23'),
(41, 29, NULL, '112', 0, NULL, 42, '2025-09-01 09:01:20', '2025-09-01 09:01:20'),
(42, 29, NULL, '113', 0, NULL, 42, '2025-09-01 09:01:20', '2025-09-01 09:01:20'),
(43, 29, NULL, '114', 0, NULL, 42, '2025-09-01 09:01:20', '2025-09-01 09:01:20'),
(44, 29, NULL, '115', 0, NULL, 42, '2025-09-01 09:01:20', '2025-09-01 09:01:20'),
(45, 26, NULL, '223', 1, '2025-09-01 10:22:21', 41, '2025-09-01 09:01:37', '2025-09-01 10:22:21'),
(46, 26, NULL, '224', 0, '2025-09-01 09:21:44', 41, '2025-09-01 09:01:37', '2025-09-01 09:51:45'),
(47, 26, NULL, '225', 0, '2025-09-01 09:21:44', 41, '2025-09-01 09:01:37', '2025-09-01 09:51:45'),
(48, 26, NULL, '226', 0, NULL, 41, '2025-09-01 09:01:37', '2025-09-01 09:01:37'),
(49, 27, 25, '123dasda', 0, NULL, 41, '2025-09-01 10:48:09', '2025-09-01 10:48:09'),
(50, 31, NULL, '123124123123', 0, NULL, 41, '2025-09-01 12:05:36', '2025-09-01 12:05:36'),
(51, 30, NULL, '321354984623', 0, NULL, 42, '2025-09-01 12:06:12', '2025-09-01 12:06:12');

-- --------------------------------------------------------

--
-- Table structure for table `OrderLicenses`
--

CREATE TABLE `OrderLicenses` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `license_id` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `OrderLicenses`
--

INSERT INTO `OrderLicenses` (`id`, `order_id`, `license_id`, `createdAt`, `updatedAt`) VALUES
(32, 39, 15, '2025-09-01 10:17:12', '2025-09-01 10:17:12'),
(33, 43, 45, '2025-09-01 10:22:21', '2025-09-01 10:22:21'),
(34, 44, 18, '2025-09-01 11:07:00', '2025-09-01 11:07:00');

-- --------------------------------------------------------

--
-- Table structure for table `Orders`
--

CREATE TABLE `Orders` (
  `id` int(11) NOT NULL,
  `order_id` varchar(255) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `os` varchar(255) NOT NULL,
  `version` varchar(255) NOT NULL,
  `license_count` int(11) NOT NULL DEFAULT 1,
  `status` enum('pending','processed') NOT NULL DEFAULT 'pending',
  `user_id` int(11) DEFAULT NULL,
  `software_id` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `Orders`
--

INSERT INTO `Orders` (`id`, `order_id`, `item_name`, `os`, `version`, `license_count`, `status`, `user_id`, `software_id`, `createdAt`, `updatedAt`) VALUES
(39, '250901C5RU11W9-1', 'Olah', 'Windows', '4.1.1.4', 1, 'processed', 41, 26, '2025-09-01 10:17:12', '2025-09-01 10:17:12'),
(43, '250901C84APCQV-1', 'Olah', 'Windows', '4.1.1.4', 1, 'processed', 41, 26, '2025-09-01 10:22:21', '2025-09-01 10:22:21'),
(44, '250901CAS6TDSY-1', 'Olah', 'Windows', '4.1.1.4', 1, 'processed', 42, 29, '2025-09-01 11:07:00', '2025-09-01 11:07:00');

-- --------------------------------------------------------

--
-- Table structure for table `PaymentMethods`
--

CREATE TABLE `PaymentMethods` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `type` enum('manual','tripay') DEFAULT 'manual',
  `account_number` varchar(100) DEFAULT NULL,
  `account_name` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `tripay_code` varchar(50) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Payments`
--

CREATE TABLE `Payments` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_subscription_id` int(11) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','success','failed') DEFAULT 'pending',
  `reference_id` varchar(255) DEFAULT NULL,
  `payment_details` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_methods`
--

CREATE TABLE `payment_methods` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `type` enum('manual','tripay') DEFAULT 'manual',
  `is_active` tinyint(1) DEFAULT 1,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`config`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `payment_methods`
--

INSERT INTO `payment_methods` (`id`, `name`, `type`, `is_active`, `config`) VALUES
(1, 'QRIS', 'manual', 1, '{\"image\":\"qris.png\"}'),
(2, 'Dana', 'manual', 1, '{\"number\":\"08123456789\"}'),
(3, 'Ovo', 'manual', 1, '{\"number\":\"08123456789\"}'),
(4, 'Gopay', 'manual', 1, '{\"number\":\"08123456789\"}'),
(5, 'Bank Transfer', 'manual', 1, '{\"bank\":\"BCA\",\"account\":\"1234567890\"}'),
(6, 'Tripay', 'tripay', 1, '{}');

-- --------------------------------------------------------

--
-- Table structure for table `Plans`
--

CREATE TABLE `Plans` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price` int(11) NOT NULL,
  `duration` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `SequelizeMeta`
--

CREATE TABLE `SequelizeMeta` (
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `SequelizeMeta`
--

INSERT INTO `SequelizeMeta` (`name`) VALUES
('20250216100716-create-software.js'),
('20250216100805-create-software-version.js'),
('20250216100833-create-license.js'),
('20250216100855-create-order.js'),
('20250216112510-add-software_id-to-orders.js'),
('20250216115038-alter-software-id-nullable.js'),
('20250221130217-add-search-by-version-to-software.js'),
('20250221133306-add-timestamps.js');

-- --------------------------------------------------------

--
-- Table structure for table `Settings`
--

CREATE TABLE `Settings` (
  `id` int(11) NOT NULL,
  `whatsapp_number` varchar(255) NOT NULL DEFAULT '+628123456789',
  `whatsapp_message` text NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Software`
--

CREATE TABLE `Software` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `requires_license` tinyint(1) NOT NULL DEFAULT 0,
  `search_by_version` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `Software`
--

INSERT INTO `Software` (`id`, `user_id`, `name`, `requires_license`, `search_by_version`, `createdAt`, `updatedAt`) VALUES
(25, NULL, 'tes', 1, 0, '2025-08-30 07:32:32', '2025-08-30 07:32:32'),
(26, 41, 'Olah', 1, 0, '2025-08-30 07:42:09', '2025-08-30 07:42:09'),
(27, 41, 'SPSS', 1, 1, '2025-08-30 07:52:52', '2025-08-30 07:52:52'),
(28, 42, 'SPSS', 1, 1, '2025-08-30 07:54:49', '2025-08-30 07:54:49'),
(29, 42, 'Olah', 1, 0, '2025-08-30 12:34:47', '2025-08-30 12:34:47'),
(30, 42, 'SmartPLS', 1, 0, '2025-08-30 12:47:44', '2025-08-30 12:47:44'),
(31, 41, 'SmartPLS', 1, 0, '2025-08-30 12:49:02', '2025-08-30 12:49:02'),
(33, 41, 'Nvivo', 1, 0, '2025-09-01 07:08:30', '2025-09-01 07:08:30'),
(34, 42, 'Nvivo', 1, 0, '2025-09-01 07:10:50', '2025-09-01 07:10:50');

-- --------------------------------------------------------

--
-- Table structure for table `SoftwareVersions`
--

CREATE TABLE `SoftwareVersions` (
  `id` int(11) NOT NULL,
  `software_id` int(11) NOT NULL,
  `version` varchar(255) NOT NULL,
  `os` varchar(255) NOT NULL,
  `download_link` text NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `SoftwareVersions`
--

INSERT INTO `SoftwareVersions` (`id`, `software_id`, `version`, `os`, `download_link`, `user_id`, `createdAt`, `updatedAt`) VALUES
(17, 25, '13', '12', '13', NULL, '2025-08-30 07:32:46', '2025-08-30 07:32:46'),
(18, 26, '4.1.1.4', 'Windows', 'https://mediafire.com/11111111111111111111', 41, '2025-08-30 07:42:42', '2025-09-01 09:16:54'),
(19, 27, '31', 'Mac Intel / M1 - M4', 'https://mediafire.com/11111111111111111111', 41, '2025-08-30 07:53:38', '2025-08-31 19:24:29'),
(20, 28, '31', 'Mac Intel / M1 - M4', 'https://mediafire.com/222222222222', 42, '2025-08-30 07:55:10', '2025-08-31 19:24:47'),
(21, 29, '4.1.1.4', 'Windows', 'https://mediafire.com/222222222222', 42, '2025-08-30 12:35:06', '2025-08-31 19:24:58'),
(22, 30, '4.1.1.4', 'Windows', 'https://mediafire.com/222222222222', 42, '2025-08-30 12:48:09', '2025-08-31 19:24:44'),
(23, 31, '4.1.1.4', 'Windows', 'https://mediafire.com/11111111111111111111', 41, '2025-08-30 12:49:15', '2025-08-31 19:24:26'),
(25, 27, '31', 'Windows', 'https://mediafire.com/1231231231231', 41, '2025-08-30 14:07:15', '2025-08-30 14:12:00'),
(26, 28, '31', 'Windows', 'https://mediafire.com/222222222222', 42, '2025-08-30 14:08:00', '2025-08-31 19:25:02'),
(27, 33, '15', 'Windows', 'https://mediafire.com/11111111111111111111', 41, '2025-09-01 07:09:46', '2025-09-01 07:09:46'),
(28, 34, '15', 'Windows', 'https://mediafire.com/222222222222', 42, '2025-09-01 07:11:10', '2025-09-01 07:11:10'),
(29, 31, '4.1.1.2', 'Mac OS', 'https://mediafire.com/11111111111111', 41, '2025-09-01 12:05:18', '2025-09-01 12:05:18'),
(30, 30, '4.1.1.2', 'Mac OS', 'https://mediafire.com/222222222222', 42, '2025-09-01 12:05:57', '2025-09-01 12:05:57');

-- --------------------------------------------------------

--
-- Table structure for table `SubscriptionPlans`
--

CREATE TABLE `SubscriptionPlans` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `duration_days` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `SubscriptionPlans`
--

INSERT INTO `SubscriptionPlans` (`id`, `name`, `duration_days`, `price`, `description`, `is_active`, `createdAt`, `updatedAt`) VALUES
(14, '1 Bulan', 30, 150000.00, 'Langganan selama 1 bulan', 1, '2025-08-21 13:15:46', '2025-08-26 12:07:48'),
(15, '3 Bulan', 90, 400000.00, 'Langganan selama 3 bulan', 1, '2025-08-21 13:15:46', '2025-08-26 12:08:00'),
(16, '6 Bulan', 180, 700000.00, 'Langganan selama 6 bulan', 1, '2025-08-21 13:15:46', '2025-08-26 12:08:12'),
(17, '1 Tahun', 365, 1300000.00, 'Langganan selama 1 tahun', 1, '2025-08-21 13:15:46', '2025-08-26 12:08:28');

-- --------------------------------------------------------

--
-- Table structure for table `Subscriptions`
--

CREATE TABLE `Subscriptions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `status` enum('active','expired','canceled') NOT NULL DEFAULT 'active',
  `payment_status` enum('pending','paid','failed') NOT NULL DEFAULT 'pending',
  `payment_method` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `Subscriptions`
--

INSERT INTO `Subscriptions` (`id`, `user_id`, `start_date`, `end_date`, `status`, `payment_status`, `payment_method`, `createdAt`, `updatedAt`) VALUES
(17, 41, '2025-08-30 07:40:01', '2025-09-03 07:40:01', 'canceled', 'paid', 'manual', '2025-08-30 07:40:01', '2025-09-01 12:10:27'),
(18, 42, '2025-08-30 07:56:04', '2025-09-03 07:56:04', 'active', 'paid', 'manual', '2025-08-30 07:56:04', '2025-09-01 08:43:08');

-- --------------------------------------------------------

--
-- Table structure for table `TripaySettings`
--

CREATE TABLE `TripaySettings` (
  `id` int(11) NOT NULL,
  `api_key` varchar(255) NOT NULL,
  `private_key` varchar(255) NOT NULL,
  `merchant_code` varchar(100) NOT NULL,
  `is_sandbox` tinyint(1) DEFAULT 1,
  `is_active` tinyint(1) DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Users`
--

CREATE TABLE `Users` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `url_slug` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `user_url_id` varchar(255) DEFAULT NULL,
  `url_active` tinyint(1) NOT NULL DEFAULT 0,
  `backend_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `Users`
--

INSERT INTO `Users` (`id`, `username`, `email`, `password`, `role`, `url_slug`, `createdAt`, `updatedAt`, `user_url_id`, `url_active`, `backend_url`) VALUES
(1, 'admin', 'danysadewa711@gmail.com', '$2b$10$GbpekXn6.oitbBiQLdLye.hzIFGZmJ2AjYmMLKv1TjeOGp2/cJ.Vm', 'admin', 'admin-bf5f85f7', '2025-08-20 04:54:37', '2025-08-22 12:25:04', NULL, 1, NULL),
(41, 'far', 'far@gmail.com', '$2b$10$.wIo2WxodsWo/3GBb2giWewaEK6MC4mNZ76prfWv/gvWNZwr8I6PG', 'user', 'far-4df00afd', '2025-08-30 07:38:52', '2025-08-30 08:03:27', NULL, 0, NULL),
(42, 'far2', 'far2@gmail.com', '$2b$10$pIEd79hfXQkNqPUrNjfVm.iw0zBDiJS1VN59skfwdPj6D/mIGdmjO', 'user', 'far2-c865b5bd', '2025-08-30 07:54:30', '2025-08-30 07:54:30', NULL, 0, NULL),
(43, 'far3', 'far3@gmail.com', '$2b$10$X0i5i2qeFV6.2ZPqnxhYfu/7tS/7K/ICdDDsiPMhhO/ZyXc5uMPeG', 'user', 'far3-fc0c204d', '2025-08-30 15:09:26', '2025-08-30 15:09:26', NULL, 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `UserSubscriptions`
--

CREATE TABLE `UserSubscriptions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `subscription_id` int(11) NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_trial` tinyint(1) DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `Licenses`
--
ALTER TABLE `Licenses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `license_key` (`license_key`),
  ADD KEY `software_id` (`software_id`),
  ADD KEY `software_version_id` (`software_version_id`),
  ADD KEY `fk_licenses_user` (`user_id`);

--
-- Indexes for table `OrderLicenses`
--
ALTER TABLE `OrderLicenses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `OrderLicenses_license_id_order_id_unique` (`order_id`,`license_id`),
  ADD KEY `license_id` (`license_id`);

--
-- Indexes for table `Orders`
--
ALTER TABLE `Orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_id` (`order_id`),
  ADD KEY `fk_user_id` (`user_id`),
  ADD KEY `Orders_software_id_foreign_idx` (`software_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `PaymentMethods`
--
ALTER TABLE `PaymentMethods`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `Payments`
--
ALTER TABLE `Payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `user_subscription_id` (`user_subscription_id`);

--
-- Indexes for table `payment_methods`
--
ALTER TABLE `payment_methods`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `Plans`
--
ALTER TABLE `Plans`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `SequelizeMeta`
--
ALTER TABLE `SequelizeMeta`
  ADD PRIMARY KEY (`name`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `Settings`
--
ALTER TABLE `Settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `Software`
--
ALTER TABLE `Software`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_software_user` (`user_id`);

--
-- Indexes for table `SoftwareVersions`
--
ALTER TABLE `SoftwareVersions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `software_id` (`software_id`),
  ADD KEY `fk_softwareversions_user` (`user_id`);

--
-- Indexes for table `SubscriptionPlans`
--
ALTER TABLE `SubscriptionPlans`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `Subscriptions`
--
ALTER TABLE `Subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id` (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `TripaySettings`
--
ALTER TABLE `TripaySettings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `Users`
--
ALTER TABLE `Users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `url_slug` (`url_slug`),
  ADD UNIQUE KEY `user_url_id` (`user_url_id`);

--
-- Indexes for table `UserSubscriptions`
--
ALTER TABLE `UserSubscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `subscription_id` (`subscription_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `Licenses`
--
ALTER TABLE `Licenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `OrderLicenses`
--
ALTER TABLE `OrderLicenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `Orders`
--
ALTER TABLE `Orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=159;

--
-- AUTO_INCREMENT for table `PaymentMethods`
--
ALTER TABLE `PaymentMethods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Payments`
--
ALTER TABLE `Payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payment_methods`
--
ALTER TABLE `payment_methods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `Plans`
--
ALTER TABLE `Plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Settings`
--
ALTER TABLE `Settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Software`
--
ALTER TABLE `Software`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `SoftwareVersions`
--
ALTER TABLE `SoftwareVersions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `SubscriptionPlans`
--
ALTER TABLE `SubscriptionPlans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `Subscriptions`
--
ALTER TABLE `Subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `TripaySettings`
--
ALTER TABLE `TripaySettings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Users`
--
ALTER TABLE `Users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `UserSubscriptions`
--
ALTER TABLE `UserSubscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `Licenses`
--
ALTER TABLE `Licenses`
  ADD CONSTRAINT `Licenses_ibfk_1` FOREIGN KEY (`software_id`) REFERENCES `Software` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Licenses_ibfk_2` FOREIGN KEY (`software_version_id`) REFERENCES `SoftwareVersions` (`id`),
  ADD CONSTRAINT `fk_licenses_user` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `OrderLicenses`
--
ALTER TABLE `OrderLicenses`
  ADD CONSTRAINT `OrderLicenses_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `Orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `OrderLicenses_ibfk_2` FOREIGN KEY (`license_id`) REFERENCES `Licenses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Orders`
--
ALTER TABLE `Orders`
  ADD CONSTRAINT `Orders_software_id_foreign_idx` FOREIGN KEY (`software_id`) REFERENCES `Software` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `user_id` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`);

--
-- Constraints for table `Payments`
--
ALTER TABLE `Payments`
  ADD CONSTRAINT `Payments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Payments_ibfk_2` FOREIGN KEY (`user_subscription_id`) REFERENCES `UserSubscriptions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Software`
--
ALTER TABLE `Software`
  ADD CONSTRAINT `fk_software_user` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `SoftwareVersions`
--
ALTER TABLE `SoftwareVersions`
  ADD CONSTRAINT `SoftwareVersions_ibfk_1` FOREIGN KEY (`software_id`) REFERENCES `Software` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_softwareversions_user` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `Subscriptions`
--
ALTER TABLE `Subscriptions`
  ADD CONSTRAINT `Subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `UserSubscriptions`
--
ALTER TABLE `UserSubscriptions`
  ADD CONSTRAINT `UserSubscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `UserSubscriptions_ibfk_2` FOREIGN KEY (`subscription_id`) REFERENCES `Subscriptions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
