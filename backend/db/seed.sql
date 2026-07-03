-- Seeding script for Clothing E-Commerce

-- Clean up existing data first
TRUNCATE product_variants, products, users, orders, order_items RESTART IDENTITY CASCADE;

-- Pre-generated users:
-- admin@store.com / admin123 -> password_hash is bcrypt of 'admin123'
-- customer@store.com / customer123 -> password_hash is bcrypt of 'customer123'
INSERT INTO users (id, email, password_hash, name, role) VALUES
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'admin@store.com', '$2a$10$w8T06B.iV2b11B41qQkEse6Z2T8p3s0vWjFswi8Kk7G2gH0qg1kI2', 'Admin User', 'admin'),
('f6e5d4c3-b2a1-0f9e-8d7c-6b5a4f3e2d1c', 'customer@store.com', '$2a$10$1r2mQd8kEqrF3/TqgqRehO9R0e7X5V5r3l1k2hF7Qc4Ld9rC8t1fR', 'Jane Customer', 'customer');

-- Products
INSERT INTO products (id, name, description, price, category, image_url) VALUES
('c830d922-83b3-4f9b-8e10-449e7b26d510', 'Men''s Classic Oxford Shirt', 'A timeless classic crafted from 100% breathable organic cotton. Featuring a button-down collar and a tailored fit. Perfect for smart-casual wear.', 49.99, 'Men', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80'),
('d5be083d-3b7c-473d-9d41-eeef34b41e3d', 'Men''s Core Jogger Pants', 'Designed for daily comfort. Made from a premium fleece blend with elastic cuffs, adjustable drawstring, and zippered pockets for secure storage.', 39.99, 'Men', 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=600&q=80'),
('a49250f1-4df2-479c-b5f7-4148b59ad5b5', 'Women''s Knit Cardigan', 'Stay cozy in style with this textured open-front cardigan. Features drop shoulders, ribbed trims, and a soft, chunky knit texture.', 59.99, 'Women', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80'),
('b0f3e69f-4318-4d57-9db0-362cbe9b7d59', 'Women''s Pleated Midi Dress', 'Elegance for any occasion. Designed with a structured bodice, flowing pleated skirt, and an adjustable waist belt for a defined silhouette.', 79.99, 'Women', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80'),
('e9a65d0a-9d96-4a41-863a-bbce86a341b1', 'Vegan Leather Backpack', 'A sleek and modern backpack with a water-resistant leather-look finish. Dedicated laptop sleeve (up to 15") and multiple interior organizer pockets.', 89.99, 'Accessories', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80'),
('f2c270d4-1a3b-4171-8930-b969e06cd2a1', 'Minimalist Steel Watch', 'A beautiful minimalist timepiece with a surgical-grade stainless steel case, sapphire-coated glass, and a precise Japanese quartz movement.', 120.00, 'Accessories', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80');

-- Product Variants (Sizes, Colors, Stock)
INSERT INTO product_variants (product_id, size, color, stock_quantity) VALUES
-- Oxford Shirt (Blue)
('c830d922-83b3-4f9b-8e10-449e7b26d510', 'S', 'Blue', 25),
('c830d922-83b3-4f9b-8e10-449e7b26d510', 'M', 'Blue', 40),
('c830d922-83b3-4f9b-8e10-449e7b26d510', 'L', 'Blue', 35),
('c830d922-83b3-4f9b-8e10-449e7b26d510', 'XL', 'Blue', 15),
-- Oxford Shirt (White)
('c830d922-83b3-4f9b-8e10-449e7b26d510', 'S', 'White', 30),
('c830d922-83b3-4f9b-8e10-449e7b26d510', 'M', 'White', 50),
('c830d922-83b3-4f9b-8e10-449e7b26d510', 'L', 'White', 45),
('c830d922-83b3-4f9b-8e10-449e7b26d510', 'XL', 'White', 20),

-- Joggers (Charcoal)
('d5be083d-3b7c-473d-9d41-eeef34b41e3d', 'M', 'Charcoal', 30),
('d5be083d-3b7c-473d-9d41-eeef34b41e3d', 'L', 'Charcoal', 25),
('d5be083d-3b7c-473d-9d41-eeef34b41e3d', 'XL', 'Charcoal', 10),
-- Joggers (Black)
('d5be083d-3b7c-473d-9d41-eeef34b41e3d', 'M', 'Black', 40),
('d5be083d-3b7c-473d-9d41-eeef34b41e3d', 'L', 'Black', 35),
('d5be083d-3b7c-473d-9d41-eeef34b41e3d', 'XL', 'Black', 15),

-- Cardigan (Beige)
('a49250f1-4df2-479c-b5f7-4148b59ad5b5', 'S', 'Beige', 15),
('a49250f1-4df2-479c-b5f7-4148b59ad5b5', 'M', 'Beige', 25),
('a49250f1-4df2-479c-b5f7-4148b59ad5b5', 'L', 'Beige', 20),
-- Cardigan (Sage Green)
('a49250f1-4df2-479c-b5f7-4148b59ad5b5', 'S', 'Sage Green', 10),
('a49250f1-4df2-479c-b5f7-4148b59ad5b5', 'M', 'Sage Green', 20),
('a49250f1-4df2-479c-b5f7-4148b59ad5b5', 'L', 'Sage Green', 15),

-- Midi Dress (Lavender)
('b0f3e69f-4318-4d57-9db0-362cbe9b7d59', 'S', 'Lavender', 12),
('b0f3e69f-4318-4d57-9db0-362cbe9b7d59', 'M', 'Lavender', 18),
('b0f3e69f-4318-4d57-9db0-362cbe9b7d59', 'L', 'Lavender', 10),
-- Midi Dress (Black)
('b0f3e69f-4318-4d57-9db0-362cbe9b7d59', 'S', 'Black', 15),
('b0f3e69f-4318-4d57-9db0-362cbe9b7d59', 'M', 'Black', 22),
('b0f3e69f-4318-4d57-9db0-362cbe9b7d59', 'L', 'Black', 14),

-- Backpack (Tan)
('e9a65d0a-9d96-4a41-863a-bbce86a341b1', 'One Size', 'Tan', 30),
-- Backpack (Black)
('e9a65d0a-9d96-4a41-863a-bbce86a341b1', 'One Size', 'Black', 45),

-- Watch (Silver)
('f2c270d4-1a3b-4171-8930-b969e06cd2a1', 'One Size', 'Silver', 15),
-- Watch (Rose Gold)
('f2c270d4-1a3b-4171-8930-b969e06cd2a1', 'One Size', 'Rose Gold', 8);
