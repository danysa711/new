-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: May 23, 2025 at 12:18 AM
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
  `license_key` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `used_at` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp(),
  `software_version_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `OrderLicenses`
--

CREATE TABLE `OrderLicenses` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `license_id` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp()
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
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp(),
  `software_id` int(11) DEFAULT NULL
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
('20250221133306-add-timestamps.js'),
('20250222065905-add-software-version-id-to-licenses.js'),
('20250225074036-create_order_licenses.js'),
('20250324225326-create_users_table.js');

-- --------------------------------------------------------

--
-- Table structure for table `Software`
--

CREATE TABLE `Software` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `requires_license` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp(),
  `search_by_version` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

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
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Users`
--

CREATE TABLE `Users` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `Users`
--

INSERT INTO `Users` (`id`, `username`, `password`, `createdAt`, `updatedAt`) VALUES
(1, 'admin', '$2b$10$szQFNahj159W5k0X3s7bzu05PZQhwfzKwzrQjEK5CX7K4OabAq31S', '2025-04-19 03:39:35', '2025-05-22 17:18:02');

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
  ADD KEY `Licenses_software_version_id_foreign_idx` (`software_version_id`);

--
-- Indexes for table `OrderLicenses`
--
ALTER TABLE `OrderLicenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `license_id` (`license_id`);

--
-- Indexes for table `Orders`
--
ALTER TABLE `Orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_id` (`order_id`),
  ADD KEY `Orders_software_id_foreign_idx` (`software_id`);

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
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `SoftwareVersions`
--
ALTER TABLE `SoftwareVersions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `software_id` (`software_id`);

--
-- Indexes for table `Users`
--
ALTER TABLE `Users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `Licenses`
--
ALTER TABLE `Licenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1676;

--
-- AUTO_INCREMENT for table `OrderLicenses`
--
ALTER TABLE `OrderLicenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1043;

--
-- AUTO_INCREMENT for table `Orders`
--
ALTER TABLE `Orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1821;

--
-- AUTO_INCREMENT for table `Software`
--
ALTER TABLE `Software`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `SoftwareVersions`
--
ALTER TABLE `SoftwareVersions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=193;

--
-- AUTO_INCREMENT for table `Users`
--
ALTER TABLE `Users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `Licenses`
--
ALTER TABLE `Licenses`
  ADD CONSTRAINT `Licenses_ibfk_1` FOREIGN KEY (`software_id`) REFERENCES `Software` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Licenses_software_version_id_foreign_idx` FOREIGN KEY (`software_version_id`) REFERENCES `SoftwareVersions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

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
  ADD CONSTRAINT `Orders_software_id_foreign_idx` FOREIGN KEY (`software_id`) REFERENCES `Software` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `SoftwareVersions`
--
ALTER TABLE `SoftwareVersions`
  ADD CONSTRAINT `SoftwareVersions_ibfk_1` FOREIGN KEY (`software_id`) REFERENCES `Software` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
