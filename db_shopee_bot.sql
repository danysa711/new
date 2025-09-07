-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Sep 07, 2025 at 04:51 AM
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
(36, 27, 25, '09f2546546c8', 1, '2025-09-01 15:13:32', 41, '2025-08-30 14:07:34', '2025-09-01 15:13:32'),
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
(34, 44, 18, '2025-09-01 11:07:00', '2025-09-01 11:07:00'),
(38, 159, 36, '2025-09-01 15:13:32', '2025-09-01 15:13:32');

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
(44, '250901CAS6TDSY-1', 'Olah', 'Windows', '4.1.1.4', 1, 'processed', 42, 29, '2025-09-01 11:07:00', '2025-09-01 11:07:00'),
(159, '250901CR6S2JGK-1', 'SPSS', 'Windows', '31', 1, 'processed', 41, 27, '2025-09-01 15:13:32', '2025-09-01 15:13:32');

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
('20250221133306-add-timestamps.js'),
('20250225074036-create_order_licenses.js'),
('20250324225326-create_users_table.js'),
('20250820093119-add-user-id-to-tables.js'),
('20250820095420-add-tripay-fields.js'),
('20250830000000-create-whatsapp-trial-settings.js'),
('20250906090141-update-payment-settings.js'),
('202509070358-create-whatsapp-settings.js'),
('2025090711-create-settings-table.js'),
('20250920000001-create-setting.js'),
('20250920000002-create-subscription-order.js');

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
-- Table structure for table `SubscriptionOrders`
--

CREATE TABLE `SubscriptionOrders` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `reference` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(255) NOT NULL DEFAULT 'whatsapp_qris',
  `payment_status` enum('pending','paid','failed','expired') NOT NULL DEFAULT 'pending',
  `status` enum('PENDING','VERIFIED','REJECTED','EXPIRED') NOT NULL DEFAULT 'PENDING',
  `payment_proof` varchar(255) DEFAULT NULL,
  `expired_at` datetime NOT NULL,
  `verified_at` datetime DEFAULT NULL,
  `verified_by` varchar(255) DEFAULT NULL,
  `rejected_at` datetime DEFAULT NULL,
  `rejected_by` varchar(255) DEFAULT NULL,
  `user_notes` text DEFAULT NULL,
  `admin_notes` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

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
(16, '6 Bulan', 180, 700000.00, 'Langganan selama 6 bulan', 1, '2025-08-21 13:15:46', '2025-08-26 12:08:12'),
(17, '1 Tahun', 365, 1300000.00, 'Langganan selama 1 tahun', 1, '2025-08-21 13:15:46', '2025-08-26 12:08:28'),
(22, '3 Bulan', 90, 270000.00, 'Langganan selama 3 bulan', 1, '2025-09-06 09:03:04', '2025-09-06 09:03:04'),
(25, '1 Bulan', 30, 100000.00, 'Langganan selama 1 bulan', 1, '2025-09-06 16:28:32', '2025-09-06 16:28:32');

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
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp(),
  `tripay_reference` varchar(255) DEFAULT NULL,
  `tripay_merchant_ref` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `Subscriptions`
--

INSERT INTO `Subscriptions` (`id`, `user_id`, `start_date`, `end_date`, `status`, `payment_status`, `payment_method`, `createdAt`, `updatedAt`, `tripay_reference`, `tripay_merchant_ref`) VALUES
(17, 41, '2025-08-30 07:40:01', '2025-09-07 07:40:01', 'active', 'paid', 'manual', '2025-08-30 07:40:01', '2025-09-06 17:09:36', NULL, NULL),
(18, 42, '2025-08-30 07:56:04', '2025-09-03 07:56:04', 'active', 'paid', 'manual', '2025-08-30 07:56:04', '2025-09-01 08:43:08', NULL, NULL),
(19, 44, '2025-09-01 15:09:48', '2025-09-02 15:09:48', 'active', 'paid', 'manual', '2025-09-01 15:09:48', '2025-09-01 15:09:48', NULL, NULL),
(20, 45, '2025-09-02 05:48:37', '2027-11-26 05:48:37', 'active', 'paid', 'manual', '2025-09-02 05:48:37', '2025-09-05 11:54:38', NULL, NULL);

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
(43, 'far3', 'far3@gmail.com', '$2b$10$X0i5i2qeFV6.2ZPqnxhYfu/7tS/7K/ICdDDsiPMhhO/ZyXc5uMPeG', 'user', 'far3-fc0c204d', '2025-08-30 15:09:26', '2025-08-30 15:09:26', NULL, 0, NULL),
(44, 'admin33', 'danysadewa7111111@gmail.com', '$2b$10$p5hj6TM5CZi13tDPGYDVXOnMopG9QThLziTFOqEjT7MpXRKyqprFG', 'user', 'admin33-f126170f', '2025-09-01 15:05:28', '2025-09-01 15:07:15', NULL, 0, NULL),
(45, 'vins', 'vins@gmail.com', '$2b$10$eqUAjj11gN0QabB0dP.YwucDAGRmjfc00QsA6gtDaIV6rP42a.AYa', 'user', 'vins-d7628cb6', '2025-09-01 15:26:31', '2025-09-01 15:26:31', NULL, 0, NULL),
(53, 'tes', 'tes@gmail.com', '$2b$10$edrBLdRERXJRf8RtH5pemeUdmAF74lhhOlj.rDFvSpNH.WawtUYnS', 'user', 'tes-e2ea8a2b', '2025-09-06 18:35:33', '2025-09-06 18:35:33', NULL, 0, NULL),
(54, 'tripay', 'tripay@gmail.com', '$2b$10$SSxr7wupALcsObSMIuA8L.jix0Xf9iEeOHhFM4YTHyBsvOxhTI0nu', 'user', 'tripay-c1dba979', '2025-09-06 20:07:43', '2025-09-06 20:07:43', NULL, 0, NULL);

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
  `updatedAt` datetime NOT NULL,
  `status` enum('active','canceled','expired') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `whatsapp_settings`
--

CREATE TABLE `whatsapp_settings` (
  `id` int(11) NOT NULL,
  `whatsapp_number` varchar(50) NOT NULL DEFAULT '6281284712684',
  `trial_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `trial_template` text NOT NULL DEFAULT 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}',
  `support_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `whatsapp_settings`
--

INSERT INTO `whatsapp_settings` (`id`, `whatsapp_number`, `trial_enabled`, `trial_template`, `support_enabled`, `created_at`, `updated_at`) VALUES
(1, '6281284712684', 1, 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}', 1, '2025-09-07 04:15:54', '2025-09-07 04:15:54'),
(2, '6281284712684', 1, 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}', 1, '2025-09-06 21:22:26', '2025-09-06 21:22:26'),
(3, '6281284712685', 1, 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}', 1, '2025-09-06 21:22:38', '2025-09-06 21:22:38'),
(4, '6281284712685', 1, 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}', 1, '2025-09-06 21:25:59', '2025-09-06 21:25:59'),
(5, '6281284712688', 1, 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}', 1, '2025-09-06 21:26:17', '2025-09-06 21:26:17'),
(6, '6281284712688', 1, 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}', 1, '2025-09-06 21:27:27', '2025-09-06 21:27:27'),
(7, '6281284712688', 1, 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}', 1, '2025-09-06 21:37:37', '2025-09-06 21:37:37'),
(8, '6281284712688', 1, 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}', 1, '2025-09-06 21:39:34', '2025-09-06 21:39:34'),
(9, '6281284712688', 1, 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}', 1, '2025-09-06 21:41:42', '2025-09-06 21:41:42'),
(10, '6281284712688', 1, 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}', 1, '2025-09-06 21:42:42', '2025-09-06 21:42:42'),
(11, '6281284712684', 1, 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}', 1, '2025-09-06 21:44:28', '2025-09-06 21:44:28'),
(12, '6281284712684', 1, 'Halo Admin, saya {username} ingin request trial.', 1, '2025-09-06 21:45:30', '2025-09-06 21:45:30'),
(13, '6281284712684', 1, 'Halo Admin, saya {username} ingin request trial.', 1, '2025-09-06 21:45:38', '2025-09-06 21:45:38'),
(14, '6281284712684', 1, 'Halo Admin, saya dengan username: {username} ingin request trial.', 1, '2025-09-06 21:46:04', '2025-09-06 21:46:04');

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
-- Indexes for table `SequelizeMeta`
--
ALTER TABLE `SequelizeMeta`
  ADD PRIMARY KEY (`name`),
  ADD UNIQUE KEY `name` (`name`);

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
-- Indexes for table `SubscriptionOrders`
--
ALTER TABLE `SubscriptionOrders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `reference` (`reference`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `plan_id` (`plan_id`);

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
-- Indexes for table `whatsapp_settings`
--
ALTER TABLE `whatsapp_settings`
  ADD PRIMARY KEY (`id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `Orders`
--
ALTER TABLE `Orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=160;

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
-- AUTO_INCREMENT for table `SubscriptionOrders`
--
ALTER TABLE `SubscriptionOrders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `SubscriptionPlans`
--
ALTER TABLE `SubscriptionPlans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `Subscriptions`
--
ALTER TABLE `Subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `Users`
--
ALTER TABLE `Users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT for table `UserSubscriptions`
--
ALTER TABLE `UserSubscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `whatsapp_settings`
--
ALTER TABLE `whatsapp_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

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
-- Constraints for table `SubscriptionOrders`
--
ALTER TABLE `SubscriptionOrders`
  ADD CONSTRAINT `SubscriptionOrders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `SubscriptionOrders_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `SubscriptionPlans` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
