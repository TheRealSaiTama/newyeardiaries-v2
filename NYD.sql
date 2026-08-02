-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jul 21, 2026 at 08:42 PM
-- Server version: 10.11.18-MariaDB-cll-lve
-- PHP Version: 8.4.22

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `NYD`
--

-- --------------------------------------------------------

--
-- Table structure for table `code_items`
--

CREATE TABLE `code_items` (
  `id` int(11) NOT NULL,
  `code` varchar(80) NOT NULL,
  `details` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `code_items`
--

INSERT INTO `code_items` (`id`, `code`, `details`, `is_active`, `created_at`) VALUES
(1, '1', 'Power Bank Wire Less Charger Note Book', 1, '2026-06-25 12:17:23'),
(2, '2', 'Platino Pen Curve Imported PU Leather Note Book', 1, '2026-06-25 12:17:23'),
(3, '3', 'Jupiter Imported PU Leather Note Book', 1, '2026-06-25 12:17:23'),
(4, '4', 'Victor Imported PU Leather Note Book', 1, '2026-06-25 12:17:23'),
(5, '5', 'Big Lock Executive Eco Folder Diary', 1, '2026-06-25 12:17:23'),
(6, '6', 'Cobra Executive Eco Folder Diary', 1, '2026-06-25 12:17:23'),
(7, '7', 'Management Imported Leather Organiser Diary', 1, '2026-06-25 12:17:23'),
(8, '8', 'Univarsal Button PU Leather Diary', 1, '2026-06-25 12:17:23'),
(9, '9', 'Elastic Cherry Brown PU Leather Diary', 1, '2026-06-25 12:17:23'),
(10, '10', 'Magnet Flap Executive Leather Diary', 1, '2026-06-25 12:17:23'),
(11, '11', 'Regular Executive Leather Diary', 1, '2026-06-25 12:17:23'),
(12, '12', 'Big Premium Hard Bound Diary', 1, '2026-06-25 12:17:23'),
(13, '13', 'Big Regular Hard Bound Diary', 1, '2026-06-25 12:17:23'),
(14, '14', 'A5 Nano Leather Diary', 1, '2026-06-25 12:17:24'),
(15, '15', 'A5 Nano Hard Bound Diary', 1, '2026-06-25 12:17:24'),
(16, '16', 'Table Calendar Wiro', 1, '2026-06-25 12:17:24'),
(17, '17', '6 Sheet Wall Calendar (Premium)', 1, '2026-06-25 12:17:24'),
(18, '17a', '6 Sheet Wall Calendar (Eco)', 1, '2026-06-25 12:17:24'),
(19, '18', '1 Sheet Wall Calendar', 1, '2026-06-25 12:17:24'),
(20, '19', 'Note Book Big Fleppia Magnet Flap PU Leather', 1, '2026-06-25 12:17:24'),
(21, '20', 'Note Book Big Alexa Leather PU Leather', 1, '2026-06-25 12:17:24'),
(22, '21', 'Note Book Big Hard Bound', 1, '2026-06-25 12:17:24'),
(23, '22', 'A5 Wooden Note Book', 1, '2026-06-25 12:17:24'),
(24, '23', 'A5 Wiro White Hard Cover Note Book', 1, '2026-06-25 12:17:24'),
(25, '24', 'A5 Mobile Pocket Leather Note Book', 1, '2026-06-25 12:17:24');

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

CREATE TABLE `items` (
  `id` int(11) NOT NULL,
  `sheet_no` int(11) DEFAULT NULL,
  `item_code` varchar(60) DEFAULT NULL,
  `name` varchar(160) NOT NULL,
  `unit` varchar(20) NOT NULL DEFAULT 'Pcs.',
  `opening_stock` decimal(12,2) NOT NULL DEFAULT 0.00,
  `reorder_level` decimal(12,2) NOT NULL DEFAULT 0.00,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `items`
--

INSERT INTO `items` (`id`, `sheet_no`, `item_code`, `name`, `unit`, `opening_stock`, `reorder_level`, `is_active`, `created_at`) VALUES
(1, 1, 'Raw-01', 'Chief OP', 'Pcs.', 0.00, 0.00, 1, '2026-06-24 04:53:30'),
(2, 2, NULL, 'NES OP WHITE', 'Pcs.', 0.00, 0.00, 1, '2026-06-24 04:53:30'),
(3, 3, NULL, 'NES ECO CUT SIZE NATURAL', 'Pcs.', 0.00, 0.00, 1, '2026-06-24 04:53:30'),
(4, 4, NULL, 'A5 WHITE', 'Pcs.', 0.00, 0.00, 1, '2026-06-24 04:53:30'),
(8, 8, NULL, 'NES REGULAR NATURAL', 'Pcs.', 0.00, 0.00, 1, '2026-06-24 04:53:30'),
(13, 13, NULL, 'ENGINEERING KALIRAM', 'Pcs.', 0.00, 0.00, 1, '2026-06-24 04:53:30'),
(14, 14, NULL, 'GO GREEN', 'Pcs.', 0.00, 0.00, 1, '2026-06-24 04:53:30'),
(18, 18, NULL, 'NOTE BOOK GENERAL', 'Pcs.', 0.00, 0.00, 1, '2026-06-24 04:53:30'),
(28, 27, NULL, 'Test Diary ravi', '200', 0.00, 0.00, 1, '2026-06-25 10:18:27');

-- --------------------------------------------------------

--
-- Table structure for table `parties`
--

CREATE TABLE `parties` (
  `id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL,
  `type` enum('supplier','outsourcer','both') NOT NULL DEFAULT 'supplier',
  `phone` varchar(40) DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `parties`
--

INSERT INTO `parties` (`id`, `name`, `type`, `phone`, `notes`, `is_active`, `created_at`) VALUES
(1, 'Amit', 'supplier', NULL, NULL, 1, '2026-06-24 04:53:30'),
(2, 'Jindal', 'supplier', NULL, NULL, 1, '2026-06-24 04:53:30'),
(3, 'Harish', 'supplier', NULL, NULL, 1, '2026-06-24 04:53:30'),
(4, 'Alauddin', 'outsourcer', NULL, NULL, 1, '2026-06-24 04:53:30'),
(5, 'Suresh', 'outsourcer', NULL, NULL, 1, '2026-06-24 04:53:30'),
(6, 'Chhote', 'outsourcer', NULL, NULL, 1, '2026-06-24 04:53:30'),
(7, 'Lucky', 'outsourcer', NULL, NULL, 1, '2026-06-24 04:54:41');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `pay_date` date NOT NULL,
  `party_id` int(11) DEFAULT NULL,
  `amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `details` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `processes`
--

CREATE TABLE `processes` (
  `id` int(11) NOT NULL,
  `code` varchar(30) DEFAULT NULL,
  `name` varchar(120) NOT NULL,
  `default_rate` decimal(10,2) NOT NULL DEFAULT 0.00,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `processes`
--

INSERT INTO `processes` (`id`, `code`, `name`, `default_rate`, `is_active`) VALUES
(1, 'HB', 'Hard Binding', 0.00, 1),
(2, 'LF', 'Leather / Lamination Finish', 0.00, 1),
(3, 'REX', 'Rex / Cross', 0.00, 1),
(4, 'CUT', 'Cutting', 0.00, 1),
(5, 'PRINT', 'Printing', 0.00, 1);

-- --------------------------------------------------------

--
-- Table structure for table `stock_txns`
--

CREATE TABLE `stock_txns` (
  `id` int(11) NOT NULL,
  `item_id` int(11) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `txn_date` date NOT NULL,
  `txn_type` enum('purchase','issue','return','adjust','buy_final') NOT NULL,
  `challan_no` varchar(60) DEFAULT NULL,
  `party_id` int(11) DEFAULT NULL,
  `process_id` int(11) DEFAULT NULL,
  `code_item_id` int(11) DEFAULT NULL,
  `detail` varchar(255) DEFAULT NULL,
  `qty_in` decimal(12,2) NOT NULL DEFAULT 0.00,
  `qty_out` decimal(12,2) NOT NULL DEFAULT 0.00,
  `raw_qty` decimal(12,2) NOT NULL DEFAULT 0.00,
  `final_qty` decimal(12,2) NOT NULL DEFAULT 0.00,
  `rate` decimal(12,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `status` varchar(20) DEFAULT NULL,
  `highlight` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_txns`
--

INSERT INTO `stock_txns` (`id`, `item_id`, `parent_id`, `txn_date`, `txn_type`, `challan_no`, `party_id`, `process_id`, `code_item_id`, `detail`, `qty_in`, `qty_out`, `raw_qty`, `final_qty`, `rate`, `amount`, `status`, `highlight`, `created_at`) VALUES
(1, 28, NULL, '2026-06-26', 'purchase', 'ALA 12', 1, NULL, NULL, 'This is test purchase of item from Amit', 4000.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-06-26 12:18:36'),
(3, 28, NULL, '2026-06-26', 'issue', '251', 4, 4, NULL, 'This is assigne to alluding from the product test dairy', 0.00, 2000.00, 0.00, 0.00, 0.00, 0.00, 'Completed', 0, '2026-06-26 12:22:30'),
(4, 28, NULL, '2026-06-26', 'issue', '252', 6, 5, NULL, 'this is again for item test dairy for testing', 0.00, 500.00, 0.00, 0.00, 0.00, 0.00, 'In Process', 0, '2026-06-26 12:23:10'),
(5, 1, NULL, '2026-06-26', 'purchase', '112', 3, NULL, NULL, 'Harish to shop purchased', 5000.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-06-26 12:24:31'),
(6, 1, NULL, '2026-06-26', 'issue', 'Chal 112', 7, 4, NULL, 'this is another cateorgy to test', 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 'Pending', 0, '2026-06-26 12:25:05'),
(7, 1, NULL, '2026-06-26', 'issue', 'Chal2', 5, 2, NULL, 'this is again to test', 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 'In Process', 0, '2026-06-26 12:25:57'),
(8, 1, 7, '2026-06-26', 'return', 'Chal2', 5, NULL, 1, '', 300.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-06-26 12:50:08'),
(9, 1, 7, '2026-06-28', 'return', 'Chal2', 5, NULL, 11, '', 200.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-06-26 12:50:31'),
(10, 1, NULL, '2026-06-26', 'issue', 'chal5', 6, 2, NULL, 'this is third item for testing', 0.00, 500.00, 0.00, 0.00, 0.00, 0.00, 'Completed', 0, '2026-06-26 12:58:06'),
(11, 28, 3, '2026-06-27', 'return', '251', 4, NULL, 10, '', 1200.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-06-26 13:03:35'),
(12, 1, 10, '2026-06-26', 'return', 'chal5', 6, NULL, 12, '', 200.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-06-26 13:09:37'),
(13, 1, 10, '2026-06-27', 'return', 'A220', 6, 2, 19, 'this is return for the', 100.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-06-26 13:22:46'),
(14, 1, 10, '2026-06-28', 'return', 'ARG01', 6, 2, 25, 'this is for testing', 100.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-06-26 13:31:52'),
(15, 14, NULL, '2026-07-01', 'purchase', 'H-222', 3, NULL, NULL, 'Harish to shop direct, Cartage not paid', 2800.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-07-01 13:26:40'),
(16, 14, NULL, '2026-07-01', 'issue', 'Sur 56', 5, 2, NULL, 'Silky Leather', 0.00, 800.00, 0.00, 0.00, 0.00, 0.00, 'In Process', 0, '2026-07-01 13:32:05'),
(17, 14, NULL, '2026-07-01', 'return', '36', 5, 2, NULL, 'Silky Leather', 800.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-07-01 13:38:46'),
(18, 3, NULL, '2026-07-04', 'purchase', '33', 3, NULL, NULL, '', 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-07-04 11:55:37'),
(19, 3, NULL, '2026-07-04', 'issue', 'luc 12', 7, 2, NULL, '', 0.00, 400.00, 0.00, 0.00, 0.00, 0.00, 'Completed', 0, '2026-07-04 11:56:45'),
(20, 3, NULL, '2026-07-04', 'issue', 'chh 13', 6, 1, NULL, '', 0.00, 100.00, 0.00, 0.00, 0.00, 0.00, 'In Process', 0, '2026-07-04 11:58:39'),
(21, 3, NULL, '2026-07-04', 'purchase', '321', 2, NULL, NULL, '', 800.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-07-04 12:00:18'),
(22, 3, NULL, '2026-07-04', 'issue', 'ala 12', 4, 2, NULL, '', 0.00, 750.00, 0.00, 0.00, 0.00, 0.00, 'In Process', 0, '2026-07-04 12:00:58'),
(23, 1, NULL, '2026-07-04', 'issue', '12', 7, 2, NULL, '', 0.00, 250.00, 0.00, 0.00, 0.00, 0.00, 'Pending', 0, '2026-07-04 12:03:39'),
(24, 14, NULL, '2026-07-04', 'issue', '66', 7, 1, NULL, '', 0.00, 100.00, 0.00, 0.00, 0.00, 0.00, 'Pending', 0, '2026-07-04 12:03:58'),
(25, 1, NULL, '2026-07-07', 'return', '44', 7, NULL, 9, '', 400.00, 0.00, 0.00, 300.00, 0.00, 0.00, NULL, 0, '2026-07-07 09:50:15'),
(26, 1, 7, '2026-07-07', 'return', 'AKA12', 5, 2, 10, 'this is second item recieved', 200.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-07-07 11:13:51'),
(27, 1, 7, '2026-07-07', 'return', 'AKA13', 5, 2, 12, 'this is for third item testing', 200.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-07-07 11:19:42'),
(28, 1, NULL, '2026-07-07', 'return', '666', 6, NULL, 16, '', 300.00, 0.00, 400.00, 300.00, 0.00, 0.00, NULL, 0, '2026-07-07 11:41:25'),
(29, 1, 10, '2026-07-07', 'return', '857', 6, 2, 10, '', 100.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-07-07 11:42:10'),
(30, 28, 4, '2026-07-07', 'return', '987', 6, 5, 1, 'this is the first item to be recieved', 300.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-07-07 11:45:59'),
(31, 28, 4, '2026-07-07', 'return', '252', 6, 5, 10, '', 150.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-07-07 11:51:15'),
(32, 13, NULL, '2026-07-07', 'purchase', '855', 1, NULL, NULL, 'to godown', 3500.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-07-07 12:37:34'),
(33, NULL, NULL, '2026-07-07', 'buy_final', '855', 1, NULL, 2, 'ready for sale item', 300.00, 0.00, 0.00, 300.00, 0.00, 0.00, NULL, 0, '2026-07-07 12:38:20'),
(34, 13, NULL, '2026-07-07', 'issue', 'ala 332', 4, 1, NULL, '', 0.00, 550.00, 0.00, 0.00, 0.00, 0.00, 'Completed', 0, '2026-07-07 12:45:03'),
(35, 13, 34, '2026-07-07', 'return', '765', 4, 1, 12, '', 600.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-07-07 12:49:22'),
(36, 13, NULL, '2026-07-07', 'issue', '3243', 4, 1, NULL, 'testing for the item', 0.00, 3550.00, 0.00, 0.00, 0.00, 0.00, 'Completed', 0, '2026-07-07 13:05:30'),
(37, 13, 36, '2026-07-07', 'return', '432', 4, 1, 10, 'this is for testing that outsouces out quantity', 3550.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-07-07 13:06:09'),
(38, 3, NULL, '2026-07-07', 'issue', '11', 6, 5, NULL, '', 0.00, 100.00, 0.00, 0.00, 0.00, 0.00, 'Pending', 0, '2026-07-07 13:08:26'),
(39, 3, NULL, '2026-07-07', 'issue', '122', 7, 4, NULL, '', 0.00, 50.00, 0.00, 0.00, 0.00, 0.00, 'Pending', 0, '2026-07-07 13:08:52'),
(40, 3, NULL, '2026-07-07', 'issue', '132', 5, 4, NULL, '', 0.00, 400.00, 0.00, 0.00, 0.00, 0.00, 'Completed', 0, '2026-07-07 13:14:39'),
(41, 3, 40, '2026-07-07', 'return', '222', 5, 4, 13, '', 400.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-07-07 13:15:36'),
(42, 2, NULL, '2026-07-08', 'purchase', 'Lou12', 1, NULL, NULL, 'This is for testing purpose only', 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-07-08 05:37:40'),
(43, 2, NULL, '2026-07-08', 'issue', 'Lou12', 5, 4, NULL, 'saying this is outsouerce for cutting testing job', 0.00, 500.00, 0.00, 0.00, 0.00, 0.00, 'Completed', 0, '2026-07-08 05:39:07'),
(44, 2, 43, '2026-07-08', 'return', 'AKA12', 5, 4, 14, 'this for testing', 300.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-07-08 05:40:39'),
(45, 2, 43, '2026-07-08', 'return', 'Lou12', 5, 4, 10, 'this is for second test', 200.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-07-08 05:41:21'),
(46, 1, NULL, '2026-07-09', 'purchase', '818', 3, NULL, NULL, '1200 testing', 1200.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-07-09 10:00:24'),
(47, 1, NULL, '2026-07-13', 'purchase', '', 3, NULL, NULL, '', 500.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-07-13 09:25:30'),
(48, 1, NULL, '2026-07-13', 'issue', '67667', 7, 1, NULL, '', 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 'Pending', 0, '2026-07-13 09:40:39'),
(50, 14, 16, '2026-07-13', 'return', '455', 5, 2, 11, 'hggg', 750.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-07-13 09:48:48'),
(51, 3, 19, '2026-07-13', 'return', '409', 7, 2, 11, 'testing', 400.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-07-13 10:06:04'),
(52, 28, 3, '2026-07-13', 'return', '567', 4, 4, 11, 'test cartage not given', 600.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1, '2026-07-13 10:10:43'),
(53, 28, 3, '2026-07-13', 'return', 'tyy4', 4, 4, 12, '', 200.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0, '2026-07-13 10:19:50'),
(54, NULL, NULL, '2026-07-13', 'buy_final', '999', 1, NULL, 6, '', 800.00, 0.00, 0.00, 800.00, 0.00, 0.00, NULL, 0, '2026-07-13 10:54:06'),
(55, NULL, NULL, '2026-07-13', 'buy_final', '6667', 1, NULL, 8, '', 600.00, 0.00, 0.00, 600.00, 0.00, 0.00, NULL, 0, '2026-07-13 10:55:53');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password_hash`, `full_name`, `created_at`) VALUES
(1, 'admin', '$2y$10$8HHxCkX0eFPhpCBRzCYyJOunv.01BK8DZTQychF10H5BPRHYnwTde', 'New Year Diaries', '2026-06-24 04:53:30');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `code_items`
--
ALTER TABLE `code_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `parties`
--
ALTER TABLE `parties`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pay_party` (`party_id`);

--
-- Indexes for table `processes`
--
ALTER TABLE `processes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `stock_txns`
--
ALTER TABLE `stock_txns`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_item` (`item_id`),
  ADD KEY `idx_date` (`txn_date`),
  ADD KEY `idx_type` (`txn_type`),
  ADD KEY `idx_party` (`party_id`),
  ADD KEY `fk_txn_process` (`process_id`),
  ADD KEY `fk_txn_codeitem` (`code_item_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `code_items`
--
ALTER TABLE `code_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `parties`
--
ALTER TABLE `parties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `processes`
--
ALTER TABLE `processes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `stock_txns`
--
ALTER TABLE `stock_txns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_pay_party` FOREIGN KEY (`party_id`) REFERENCES `parties` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `stock_txns`
--
ALTER TABLE `stock_txns`
  ADD CONSTRAINT `fk_txn_codeitem` FOREIGN KEY (`code_item_id`) REFERENCES `code_items` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_txn_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_txn_party` FOREIGN KEY (`party_id`) REFERENCES `parties` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_txn_process` FOREIGN KEY (`process_id`) REFERENCES `processes` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
