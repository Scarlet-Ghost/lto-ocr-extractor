-- Philippine Market 2024-2025 Vehicle SRPs
-- Source: ph_market_2025 (dealer published prices, PHP)
-- Run AFTER vehicle-srps-schema.sql

INSERT INTO vehicle_srps (make, model, variant, body_type, year_from, year_to, srp, source) VALUES

-- ============================================================
-- TOYOTA
-- ============================================================
('Toyota', 'Wigo', '1.0 G AT', 'hatchback', 2023, 2025, 618000.00, 'ph_market_2025'),
('Toyota', 'Wigo', '1.0 G MT', 'hatchback', 2023, 2025, 578000.00, 'ph_market_2025'),

('Toyota', 'Vios', '1.3 XE CVT', 'sedan', 2023, 2025, 735000.00, 'ph_market_2025'),
('Toyota', 'Vios', '1.3 E CVT', 'sedan', 2023, 2025, 858000.00, 'ph_market_2025'),
('Toyota', 'Vios', '1.5 G CVT', 'sedan', 2023, 2025, 1070000.00, 'ph_market_2025'),
('Toyota', 'Vios', '1.5 GR-S CVT', 'sedan', 2023, 2025, 1118000.00, 'ph_market_2025'),

('Toyota', 'Raize', '1.0 G CVT', 'suv', 2023, 2025, 838000.00, 'ph_market_2025'),
('Toyota', 'Raize', '1.0 GR-S Turbo CVT', 'suv', 2023, 2025, 1121000.00, 'ph_market_2025'),

('Toyota', 'Rush', '1.5 E AT', 'suv', 2023, 2025, 1010000.00, 'ph_market_2025'),
('Toyota', 'Rush', '1.5 G AT', 'suv', 2023, 2025, 1170000.00, 'ph_market_2025'),
('Toyota', 'Rush', '1.5 GR-S AT', 'suv', 2023, 2025, 1295000.00, 'ph_market_2025'),

('Toyota', 'Innova', '2.0 E AT Gas', 'mpv', 2023, 2025, 1250000.00, 'ph_market_2025'),
('Toyota', 'Innova', '2.0 G AT Gas', 'mpv', 2023, 2025, 1450000.00, 'ph_market_2025'),
('Toyota', 'Innova', '2.0 V AT Gas', 'mpv', 2023, 2025, 1650000.00, 'ph_market_2025'),
('Toyota', 'Innova Zenix', '2.0 V Hybrid CVT', 'mpv', 2023, 2025, 1800000.00, 'ph_market_2025'),

('Toyota', 'Fortuner', '2.4 G 4x2 AT Diesel', 'suv', 2023, 2025, 1835000.00, 'ph_market_2025'),
('Toyota', 'Fortuner', '2.4 G 4x4 MT Diesel', 'suv', 2023, 2025, 1985000.00, 'ph_market_2025'),
('Toyota', 'Fortuner', '2.8 V 4x4 AT Diesel', 'suv', 2023, 2025, 2614000.00, 'ph_market_2025'),
('Toyota', 'Fortuner', '2.8 LTD 4x4 AT Diesel', 'suv', 2023, 2025, 2614000.00, 'ph_market_2025'),

('Toyota', 'Hilux', '2.4 J MT Diesel', 'pickup', 2023, 2025, 1100000.00, 'ph_market_2025'),
('Toyota', 'Hilux', '2.4 E MT Diesel', 'pickup', 2023, 2025, 1300000.00, 'ph_market_2025'),
('Toyota', 'Hilux', '2.8 G 4x2 AT Diesel', 'pickup', 2023, 2025, 1640000.00, 'ph_market_2025'),
('Toyota', 'Hilux', '2.8 G 4x4 AT Diesel', 'pickup', 2023, 2025, 2050000.00, 'ph_market_2025'),

('Toyota', 'HiAce', '2.8 Commuter MT Diesel', 'van', 2023, 2025, 1550000.00, 'ph_market_2025'),
('Toyota', 'HiAce', '2.8 GL Grandia MT Diesel', 'van', 2023, 2025, 1950000.00, 'ph_market_2025'),
('Toyota', 'HiAce', '2.8 GL Grandia Tourer AT Diesel', 'van', 2023, 2025, 2300000.00, 'ph_market_2025'),

('Toyota', 'Corolla Cross', '1.8 S CVT', 'suv', 2023, 2025, 1285000.00, 'ph_market_2025'),
('Toyota', 'Corolla Cross', '1.8 V CVT', 'suv', 2023, 2025, 1450000.00, 'ph_market_2025'),
('Toyota', 'Corolla Cross', '1.8 GR-S CVT', 'suv', 2023, 2025, 1650000.00, 'ph_market_2025'),

('Toyota', 'Camry', '2.5 V AT', 'sedan', 2023, 2025, 2200000.00, 'ph_market_2025'),
('Toyota', 'Camry', '2.5 Hybrid AT', 'sedan', 2023, 2025, 2500000.00, 'ph_market_2025'),

-- ============================================================
-- MITSUBISHI
-- ============================================================
('Mitsubishi', 'Mirage', '1.2 GLX MT', 'hatchback', 2023, 2025, 709000.00, 'ph_market_2025'),
('Mitsubishi', 'Mirage', '1.2 GLS CVT', 'hatchback', 2023, 2025, 838000.00, 'ph_market_2025'),

('Mitsubishi', 'Mirage G4', '1.2 GLX MT', 'sedan', 2023, 2025, 708000.00, 'ph_market_2025'),
('Mitsubishi', 'Mirage G4', '1.2 GLS CVT', 'sedan', 2023, 2025, 898000.00, 'ph_market_2025'),

('Mitsubishi', 'Xpander', '1.5 GLX MT', 'mpv', 2023, 2025, 1110000.00, 'ph_market_2025'),
('Mitsubishi', 'Xpander', '1.5 GLS AT', 'mpv', 2023, 2025, 1258000.00, 'ph_market_2025'),
('Mitsubishi', 'Xpander', '1.5 GLS Sport AT', 'mpv', 2023, 2025, 1428000.00, 'ph_market_2025'),

('Mitsubishi', 'Xpander Cross', '1.5 GLS Premium AT', 'mpv', 2023, 2025, 1398000.00, 'ph_market_2025'),

('Mitsubishi', 'Montero Sport', '2.4 GLX MT Diesel', 'suv', 2023, 2025, 1818000.00, 'ph_market_2025'),
('Mitsubishi', 'Montero Sport', '2.4 GLS AT Diesel', 'suv', 2023, 2025, 2098000.00, 'ph_market_2025'),
('Mitsubishi', 'Montero Sport', '3.0 GT AT', 'suv', 2023, 2025, 2456000.00, 'ph_market_2025'),

('Mitsubishi', 'Strada', '2.4 GLX MT Diesel', 'pickup', 2023, 2025, 1065000.00, 'ph_market_2025'),
('Mitsubishi', 'Strada', '2.4 GLS AT Diesel', 'pickup', 2023, 2025, 1480000.00, 'ph_market_2025'),
('Mitsubishi', 'Strada', '2.4 GT 4x4 AT Diesel', 'pickup', 2023, 2025, 1830000.00, 'ph_market_2025'),

('Mitsubishi', 'L300', '2.2 FB Exceed MT Diesel', 'van', 2023, 2025, 908000.00, 'ph_market_2025'),

-- ============================================================
-- HONDA
-- ============================================================
('Honda', 'Brio', '1.2 S CVT', 'hatchback', 2023, 2025, 685000.00, 'ph_market_2025'),
('Honda', 'Brio', '1.2 RS CVT', 'hatchback', 2023, 2025, 760000.00, 'ph_market_2025'),

('Honda', 'City', '1.5 S CVT', 'sedan', 2023, 2025, 973000.00, 'ph_market_2025'),
('Honda', 'City', '1.5 V CVT', 'sedan', 2023, 2025, 1068000.00, 'ph_market_2025'),
('Honda', 'City', '1.5 RS CVT', 'sedan', 2023, 2025, 1168000.00, 'ph_market_2025'),

('Honda', 'Civic', '1.5 RS CVT Turbo', 'sedan', 2023, 2025, 1598000.00, 'ph_market_2025'),
('Honda', 'Civic', '1.5 RS Hatchback CVT Turbo', 'hatchback', 2023, 2025, 1758000.00, 'ph_market_2025'),
('Honda', 'Civic', '2.0 Type R MT', 'hatchback', 2023, 2025, 1890000.00, 'ph_market_2025'),

('Honda', 'CR-V', '1.5 S CVT Turbo', 'suv', 2023, 2025, 1898000.00, 'ph_market_2025'),
('Honda', 'CR-V', '1.5 V CVT Turbo', 'suv', 2023, 2025, 2198000.00, 'ph_market_2025'),
('Honda', 'CR-V', '2.0 SX AWD e:HEV CVT', 'suv', 2023, 2025, 2490000.00, 'ph_market_2025'),

('Honda', 'BR-V', '1.5 S CVT', 'suv', 2023, 2025, 1098000.00, 'ph_market_2025'),
('Honda', 'BR-V', '1.5 V CVT', 'suv', 2023, 2025, 1198000.00, 'ph_market_2025'),
('Honda', 'BR-V', '1.5 RS CVT', 'suv', 2023, 2025, 1298000.00, 'ph_market_2025'),

('Honda', 'HR-V', '1.5 E CVT', 'suv', 2023, 2025, 1398000.00, 'ph_market_2025'),
('Honda', 'HR-V', '1.5 V CVT', 'suv', 2023, 2025, 1498000.00, 'ph_market_2025'),
('Honda', 'HR-V', '1.5 RS CVT', 'suv', 2023, 2025, 1598000.00, 'ph_market_2025'),

-- ============================================================
-- NISSAN
-- ============================================================
('Nissan', 'Almera', '1.0 Turbo CVT Base', 'sedan', 2023, 2025, 798000.00, 'ph_market_2025'),
('Nissan', 'Almera', '1.0 Turbo CVT Mid', 'sedan', 2023, 2025, 878000.00, 'ph_market_2025'),
('Nissan', 'Almera', '1.0 Turbo CVT VL', 'sedan', 2023, 2025, 938000.00, 'ph_market_2025'),

('Nissan', 'Navara', '2.5 EL 4x2 AT Diesel', 'pickup', 2023, 2025, 1049000.00, 'ph_market_2025'),
('Nissan', 'Navara', '2.5 VL 4x2 AT Diesel', 'pickup', 2023, 2025, 1399000.00, 'ph_market_2025'),
('Nissan', 'Navara', '2.5 Pro-4X 4x4 AT Diesel', 'pickup', 2023, 2025, 1879000.00, 'ph_market_2025'),

('Nissan', 'Terra', '2.5 E 4x2 MT Diesel', 'suv', 2023, 2025, 1579000.00, 'ph_market_2025'),
('Nissan', 'Terra', '2.5 VL 4x2 AT Diesel', 'suv', 2023, 2025, 1879000.00, 'ph_market_2025'),
('Nissan', 'Terra', '2.5 VL 4x4 AT Diesel', 'suv', 2023, 2025, 2299000.00, 'ph_market_2025'),

-- ============================================================
-- SUZUKI
-- ============================================================
('Suzuki', 'Celerio', '1.0 GA MT', 'hatchback', 2023, 2025, 598000.00, 'ph_market_2025'),
('Suzuki', 'Celerio', '1.0 GL CVT', 'hatchback', 2023, 2025, 668000.00, 'ph_market_2025'),

('Suzuki', 'Swift', '1.2 GA MT', 'hatchback', 2023, 2025, 824000.00, 'ph_market_2025'),
('Suzuki', 'Swift', '1.2 GL CVT', 'hatchback', 2023, 2025, 914000.00, 'ph_market_2025'),

('Suzuki', 'Dzire', '1.2 GA MT', 'sedan', 2023, 2025, 690000.00, 'ph_market_2025'),
('Suzuki', 'Dzire', '1.2 GL AT', 'sedan', 2023, 2025, 784000.00, 'ph_market_2025'),

('Suzuki', 'Ertiga', '1.5 GA MT', 'mpv', 2023, 2025, 890000.00, 'ph_market_2025'),
('Suzuki', 'Ertiga', '1.5 GL AT', 'mpv', 2023, 2025, 978000.00, 'ph_market_2025'),
('Suzuki', 'Ertiga', '1.5 GLX AT', 'mpv', 2023, 2025, 1078000.00, 'ph_market_2025'),

('Suzuki', 'Jimny', '1.5 JLX AT 3-door', 'suv', 2023, 2025, 1165000.00, 'ph_market_2025'),
('Suzuki', 'Jimny', '1.5 JLX+ AT 5-door', 'suv', 2023, 2025, 1230000.00, 'ph_market_2025'),

('Suzuki', 'XL7', '1.5 Alpha AT', 'suv', 2023, 2025, 1108000.00, 'ph_market_2025'),

-- ============================================================
-- HYUNDAI
-- ============================================================
('Hyundai', 'Accent', '1.4 GL MT', 'sedan', 2023, 2025, 813000.00, 'ph_market_2025'),
('Hyundai', 'Accent', '1.4 GS AT', 'sedan', 2023, 2025, 913000.00, 'ph_market_2025'),
('Hyundai', 'Accent', '1.4 GLS AT', 'sedan', 2023, 2025, 1008000.00, 'ph_market_2025'),

('Hyundai', 'Creta', '1.5 GL IVT', 'suv', 2023, 2025, 1038000.00, 'ph_market_2025'),
('Hyundai', 'Creta', '1.5 GS IVT', 'suv', 2023, 2025, 1138000.00, 'ph_market_2025'),
('Hyundai', 'Creta', '1.5 GLS IVT', 'suv', 2023, 2025, 1288000.00, 'ph_market_2025'),

('Hyundai', 'Tucson', '2.0 GL AT', 'suv', 2023, 2025, 1398000.00, 'ph_market_2025'),
('Hyundai', 'Tucson', '2.0 GLS AT', 'suv', 2023, 2025, 1598000.00, 'ph_market_2025'),
('Hyundai', 'Tucson', '2.0 CRDI GLS AT Diesel', 'suv', 2023, 2025, 1818000.00, 'ph_market_2025'),

('Hyundai', 'Stargazer', '1.5 GL IVT', 'mpv', 2023, 2025, 998000.00, 'ph_market_2025'),
('Hyundai', 'Stargazer', '1.5 GS IVT', 'mpv', 2023, 2025, 1098000.00, 'ph_market_2025'),
('Hyundai', 'Stargazer', '1.5 GLS IVT', 'mpv', 2023, 2025, 1298000.00, 'ph_market_2025'),

-- ============================================================
-- FORD
-- ============================================================
('Ford', 'Territory', '1.5 Trend CVT EcoBoost', 'suv', 2023, 2025, 1190000.00, 'ph_market_2025'),
('Ford', 'Territory', '1.5 Titanium CVT EcoBoost', 'suv', 2023, 2025, 1340000.00, 'ph_market_2025'),

('Ford', 'Ranger', '2.0 XL MT Bi-Turbo Diesel 4x2', 'pickup', 2023, 2025, 1198000.00, 'ph_market_2025'),
('Ford', 'Ranger', '2.0 XLS AT Bi-Turbo Diesel 4x2', 'pickup', 2023, 2025, 1398000.00, 'ph_market_2025'),
('Ford', 'Ranger', '2.0 XLT AT Bi-Turbo Diesel 4x2', 'pickup', 2023, 2025, 1598000.00, 'ph_market_2025'),
('Ford', 'Ranger', '2.0 Sport AT Bi-Turbo Diesel 4x2', 'pickup', 2023, 2025, 1798000.00, 'ph_market_2025'),
('Ford', 'Ranger', '2.0 Wildtrak AT Bi-Turbo Diesel 4x4', 'pickup', 2023, 2025, 2098000.00, 'ph_market_2025'),
('Ford', 'Ranger', '3.0 Raptor AT Diesel 4x4', 'pickup', 2023, 2025, 2298000.00, 'ph_market_2025'),

('Ford', 'Everest', '2.0 Ambiente AT Bi-Turbo Diesel 4x2', 'suv', 2023, 2025, 1899000.00, 'ph_market_2025'),
('Ford', 'Everest', '2.0 Titanium+ AT Bi-Turbo Diesel 4x2', 'suv', 2023, 2025, 2299000.00, 'ph_market_2025'),
('Ford', 'Everest', '3.0 Platinum AT V6 Diesel 4x4', 'suv', 2023, 2025, 2899000.00, 'ph_market_2025'),

-- ============================================================
-- ISUZU
-- ============================================================
('Isuzu', 'D-Max', '1.9 LS 4x2 AT Blue Power', 'pickup', 2023, 2025, 997000.00, 'ph_market_2025'),
('Isuzu', 'D-Max', '3.0 LS-E 4x2 AT', 'pickup', 2023, 2025, 1250000.00, 'ph_market_2025'),
('Isuzu', 'D-Max', '3.0 LS-A 4x4 AT', 'pickup', 2023, 2025, 1500000.00, 'ph_market_2025'),
('Isuzu', 'D-Max', '3.0 V-Cross 4x4 AT', 'pickup', 2023, 2025, 1860000.00, 'ph_market_2025'),

('Isuzu', 'mu-X', '1.9 LS 4x2 AT Blue Power', 'suv', 2023, 2025, 1630000.00, 'ph_market_2025'),
('Isuzu', 'mu-X', '3.0 LS-A 4x2 AT', 'suv', 2023, 2025, 1880000.00, 'ph_market_2025'),
('Isuzu', 'mu-X', '3.0 LS-E 4x4 AT', 'suv', 2023, 2025, 2100000.00, 'ph_market_2025'),
('Isuzu', 'mu-X', '3.0 RZ4E 4x4 AT', 'suv', 2023, 2025, 2350000.00, 'ph_market_2025'),

-- ============================================================
-- BYD
-- ============================================================
('BYD', 'Dolphin', 'Dynamic', 'hatchback', 2024, 2025, 988000.00, 'ph_market_2025'),
('BYD', 'Dolphin', 'Premium', 'hatchback', 2024, 2025, 1188000.00, 'ph_market_2025'),

('BYD', 'Atto 3', 'Standard Range', 'suv', 2024, 2025, 1498000.00, 'ph_market_2025'),
('BYD', 'Atto 3', 'Extended Range', 'suv', 2024, 2025, 1798000.00, 'ph_market_2025'),

('BYD', 'Seal', 'Excellence', 'sedan', 2024, 2025, 2488000.00, 'ph_market_2025'),

('BYD', 'Emax 9', 'Premium', 'mpv', 2024, 2025, 3338000.00, 'ph_market_2025'),

-- ============================================================
-- GEELY
-- ============================================================
('Geely', 'Coolray', '1.5T Sport AT', 'suv', 2023, 2025, 1018000.00, 'ph_market_2025'),
('Geely', 'Coolray', '1.5T Premium AT', 'suv', 2023, 2025, 1098000.00, 'ph_market_2025'),
('Geely', 'Coolray', '1.5T Sport+ AT', 'suv', 2023, 2025, 1198000.00, 'ph_market_2025'),

('Geely', 'Emgrand', '1.5 Comfort CVT', 'sedan', 2023, 2025, 808000.00, 'ph_market_2025'),
('Geely', 'Emgrand', '1.5 Elegance CVT', 'sedan', 2023, 2025, 898000.00, 'ph_market_2025'),

('Geely', 'Azkarra', '1.5T Premium eDCT', 'suv', 2023, 2025, 1478000.00, 'ph_market_2025'),
('Geely', 'Azkarra', '1.5T Luxury eDCT', 'suv', 2023, 2025, 1588000.00, 'ph_market_2025'),

-- ============================================================
-- CHERY
-- ============================================================
('Chery', 'Tiggo 2 Pro', '1.5 Comfort CVT', 'suv', 2023, 2025, 695000.00, 'ph_market_2025'),
('Chery', 'Tiggo 2 Pro', '1.5 Luxury CVT', 'suv', 2023, 2025, 845000.00, 'ph_market_2025'),

('Chery', 'Tiggo 7 Pro', '1.5T Luxury DCT', 'suv', 2023, 2025, 1238000.00, 'ph_market_2025'),

('Chery', 'Tiggo 8 Pro', '2.0T Luxury DCT', 'suv', 2023, 2025, 1588000.00, 'ph_market_2025'),

-- ============================================================
-- MG
-- ============================================================
('MG', 'MG 5', '1.5T Standard AT', 'sedan', 2023, 2025, 818000.00, 'ph_market_2025'),
('MG', 'MG 5', '1.5T Alpha AT', 'sedan', 2023, 2025, 978000.00, 'ph_market_2025'),

('MG', 'ZS', '1.5 Alpha CVT', 'suv', 2023, 2025, 918000.00, 'ph_market_2025'),
('MG', 'ZS', '1.5T Alpha+ CVT', 'suv', 2023, 2025, 1048000.00, 'ph_market_2025'),
('MG', 'ZS', '1.5T Trophy CVT', 'suv', 2023, 2025, 1148000.00, 'ph_market_2025'),

('MG', 'HS', '1.5T Alpha+ DCT', 'suv', 2023, 2025, 1498000.00, 'ph_market_2025'),

-- ============================================================
-- GWM (Haval)
-- ============================================================
('GWM', 'Haval Jolion', '1.5T Comfort DCT', 'suv', 2023, 2025, 1098000.00, 'ph_market_2025'),
('GWM', 'Haval Jolion', '1.5T Luxury DCT', 'suv', 2023, 2025, 1198000.00, 'ph_market_2025'),
('GWM', 'Haval Jolion', '1.5T Ultra DCT', 'suv', 2023, 2025, 1278000.00, 'ph_market_2025'),

('GWM', 'Haval H6', '2.0T Comfort DCT', 'suv', 2023, 2025, 1578000.00, 'ph_market_2025'),
('GWM', 'Haval H6', '2.0T Luxury DCT', 'suv', 2023, 2025, 1698000.00, 'ph_market_2025'),
('GWM', 'Haval H6', '2.0T Ultra DCT', 'suv', 2023, 2025, 1798000.00, 'ph_market_2025');
