-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Aug 22, 2025 at 06:25 PM
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
(1, 1, NULL, '123', 0, NULL, NULL, '2025-08-21 13:15:45', '2025-08-21 13:15:45'),
(2, 6, 2, '13213', 0, NULL, 3, '2025-08-21 13:15:45', '2025-08-21 13:15:45');

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
(1, NULL, 'tes', 1, 0, '2025-08-21 13:15:45', '2025-08-21 13:15:45'),
(2, NULL, '213', 1, 0, '2025-08-21 13:15:45', '2025-08-21 13:15:45'),
(3, NULL, 'tes', 0, 0, '2025-08-21 13:15:45', '2025-08-21 13:15:45'),
(4, NULL, '11', 0, 0, '2025-08-21 13:15:45', '2025-08-21 13:15:45'),
(5, NULL, 'queen222', 0, 0, '2025-08-21 13:15:45', '2025-08-21 13:15:45'),
(6, 3, '1', 1, 0, '2025-08-21 13:15:45', '2025-08-21 13:15:45'),
(7, NULL, '12313', 0, 0, '2025-08-21 13:15:45', '2025-08-21 13:15:45'),
(8, NULL, '131313', 0, 0, '2025-08-21 13:15:45', '2025-08-21 13:15:45'),
(9, 11, '123123', 0, 0, '2025-08-21 13:15:45', '2025-08-21 13:15:45');

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
(1, 1, '2022', 'Mac OS', 'https://drive.google.com/open?id=1bsbeuf3mzxXLURbtbxIZ6bxE0o8D1sj4&usp=drive_fs', NULL, '2025-08-21 13:15:45', '2025-08-21 13:15:45'),
(2, 6, '3', '2', '4', 3, '2025-08-21 13:15:45', '2025-08-21 13:15:45');

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
(14, '1 Bulan', 30, 100000.00, 'Langganan selama 1 bulan', 1, '2025-08-21 13:15:46', '2025-08-21 13:15:46'),
(15, '3 Bulan', 90, 270000.00, 'Langganan selama 3 bulan', 1, '2025-08-21 13:15:46', '2025-08-21 13:15:46'),
(16, '6 Bulan', 180, 500000.00, 'Langganan selama 6 bulan', 1, '2025-08-21 13:15:46', '2025-08-21 13:15:46'),
(17, '1 Tahun', 365, 900000.00, 'Langganan selama 1 tahun', 1, '2025-08-21 13:15:46', '2025-08-21 13:15:46');

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
(2, 3, '2025-08-20 05:14:20', '2026-09-14 05:14:20', 'canceled', 'paid', 'manual', '2025-08-20 05:14:20', '2025-08-21 08:52:49'),
(3, 1, '2025-08-20 05:22:30', '2357-03-24 05:22:30', 'active', 'paid', 'manual', '2025-08-20 05:22:30', '2025-08-21 08:04:42'),
(5, 3, '2025-08-21 08:11:00', '2025-08-22 08:11:00', 'canceled', 'paid', 'manual', '2025-08-21 08:11:00', '2025-08-21 17:43:18'),
(6, 11, '2025-08-21 11:06:33', '2025-08-22 11:06:33', 'canceled', 'paid', 'manual', '2025-08-21 11:06:33', '2025-08-21 17:43:44');

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
  `url_active` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `Users`
--

INSERT INTO `Users` (`id`, `username`, `email`, `password`, `role`, `url_slug`, `createdAt`, `updatedAt`, `user_url_id`, `url_active`) VALUES
(1, 'admin', 'danysadewa711@gmail.com', '$2b$10$GbpekXn6.oitbBiQLdLye.hzIFGZmJ2AjYmMLKv1TjeOGp2/cJ.Vm', 'admin', 'admin-bf5f85f7', '2025-08-20 04:54:37', '2025-08-21 08:03:14', NULL, 0),
(3, 'queen', 'queen@gmail.com', '$2b$10$sgcZFNSKE4xSz2JucHDTgexcrRxG/qKVkDACblAYURHfDMamqaosO', 'user', 'queen-a8cd2e28', '2025-08-20 05:06:03', '2025-08-21 17:45:32', NULL, 0),
(11, 'admin23', 'aasdadssad@gmail.com', '$2b$10$idpsY.C332WGTZe8CMRFB.RA7xoYKRfAFGRgpDTO3KQ4qhsjetxRa', 'user', 'admin23-18ee5165', '2025-08-21 09:33:40', '2025-08-21 09:33:40', NULL, 0);

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
  ADD KEY `Orders_software_id_foreign_idx` (`software_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `OrderLicenses`
--
ALTER TABLE `OrderLicenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Orders`
--
ALTER TABLE `Orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

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
-- AUTO_INCREMENT for table `Software`
--
ALTER TABLE `Software`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `SoftwareVersions`
--
ALTER TABLE `SoftwareVersions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `SubscriptionPlans`
--
ALTER TABLE `SubscriptionPlans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `Subscriptions`
--
ALTER TABLE `Subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `TripaySettings`
--
ALTER TABLE `TripaySettings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Users`
--
ALTER TABLE `Users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

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
  ADD CONSTRAINT `fk_licenses_user1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

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
