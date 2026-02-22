-- Seed Products Script
-- Admin UUID: 68a5b122-2542-4552-a296-69a595b7ce4b
-- Categories seeded across all 10 categories with brand names in product name/description

INSERT INTO public.products (sku, name, description, category_id, unit, unit_size, cost_price, selling_price, low_stock_threshold, is_active, created_by) VALUES

-- BAKERY (f52efdec-b2e1-4f29-8eae-6b3411837bbb)
('BKR-001', 'Gardenia Classic White Bread', 'Brand: Gardenia | Soft white sandwich bread, 600g loaf', 'f52efdec-b2e1-4f29-8eae-6b3411837bbb', 'pcs', 1, 28.00, 42.00, 10, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),
('BKR-002', 'Julie''s Peanut Butter Crackers', 'Brand: Julie''s | Crunchy peanut butter sandwich crackers, 168g', 'f52efdec-b2e1-4f29-8eae-6b3411837bbb', 'pack', 1, 35.00, 52.00, 15, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),
('BKR-003', 'SkyFlakes Crackers', 'Brand: M.Y. San | Plain soda crackers, 800g family pack', 'f52efdec-b2e1-4f29-8eae-6b3411837bbb', 'pack', 1, 75.00, 110.00, 10, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),

-- BEVERAGES (5bcc7b9f-f82a-4804-b49f-38e085908a19)
('BEV-001', 'Nestle Milo Activ-Go Chocolate Drink', 'Brand: Nestle | Chocolate malt beverage powder, 400g tin', '5bcc7b9f-f82a-4804-b49f-38e085908a19', 'can', 1, 185.00, 265.00, 20, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),
('BEV-002', 'Nescafe Classic Instant Coffee', 'Brand: Nestle | Pure instant coffee, 200g jar', '5bcc7b9f-f82a-4804-b49f-38e085908a19', 'bottle', 1, 220.00, 310.00, 15, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),
('BEV-003', 'Coca-Cola Regular 1.5L', 'Brand: Coca-Cola | Carbonated soft drink, 1.5L bottle', '5bcc7b9f-f82a-4804-b49f-38e085908a19', 'bottle', 1.5, 55.00, 80.00, 24, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),
('BEV-004', 'Minute Maid Pulpy Orange 1L', 'Brand: Minute Maid | Orange juice with pulp, 1L tetra pack', '5bcc7b9f-f82a-4804-b49f-38e085908a19', 'bottle', 1, 62.00, 90.00, 20, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),
('BEV-005', 'Royal True Orange Soft Drink 500mL', 'Brand: Royal | Orange-flavored carbonated drink, 500mL', '5bcc7b9f-f82a-4804-b49f-38e085908a19', 'bottle', 0.5, 22.00, 35.00, 30, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),

-- CANNED & PACKAGED (3ae162ab-d2e3-4553-afdf-4bf27ea2098d)
('CAN-001', 'Del Monte Tomato Sauce', 'Brand: Del Monte | Ready-to-cook tomato sauce, 250g pack', '3ae162ab-d2e3-4553-afdf-4bf27ea2098d', 'pack', 1, 18.00, 28.00, 30, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),
('CAN-002', 'Century Tuna Chunks in Oil', 'Brand: Century | Tuna chunks in vegetable oil, 180g can', '3ae162ab-d2e3-4553-afdf-4bf27ea2098d', 'can', 1, 35.00, 52.00, 30, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),
('CAN-003', 'Ligo Sardines in Tomato Sauce', 'Brand: Ligo | Sardines in tomato sauce, 155g can', '3ae162ab-d2e3-4553-afdf-4bf27ea2098d', 'can', 1, 22.00, 34.00, 40, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),
('CAN-004', 'Lucky Me! Pancit Canton Original', 'Brand: Lucky Me! | Stir-fry noodles original flavor, 80g', '3ae162ab-d2e3-4553-afdf-4bf27ea2098d', 'pack', 1, 12.00, 18.00, 50, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),
('CAN-005', 'Knorr Complete Recipe Mix Menudo', 'Brand: Knorr | All-in-one recipe mix for menudo, 40g', '3ae162ab-d2e3-4553-afdf-4bf27ea2098d', 'pack', 1, 10.00, 16.00, 40, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),

-- CLEANING & HOUSEHOLD (4378c5c6-fa7e-4dee-be50-6efcc5722221)
('CLN-001', 'Ariel Powder Detergent Original', 'Brand: Ariel | Laundry detergent powder, 2kg box', '4378c5c6-fa7e-4dee-be50-6efcc5722221', 'box', 1, 175.00, 250.00, 15, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),
('CLN-002', 'Surf Powder Detergent Tropical', 'Brand: Surf | Tropical scent laundry powder, 1kg', '4378c5c6-fa7e-4dee-be50-6efcc5722221', 'pack', 1, 85.00, 125.00, 15, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),
('CLN-003', 'Mr. Clean Multi-Surface Cleaner', 'Brand: Mr. Clean | All-purpose liquid cleaner, 500mL', '4378c5c6-fa7e-4dee-be50-6efcc5722221', 'bottle', 0.5, 95.00, 140.00, 10, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),

-- DAIRY & EGGS (5a5477c9-fbd4-4db3-b33e-05dad70ebef2)
('DAI-001', 'Bear Brand Sterilized Milk', 'Brand: Nestle Bear Brand | Fortified sterilized milk, 1L', '5a5477c9-fbd4-4db3-b33e-05dad70ebef2', 'bottle', 1, 65.00, 95.00, 20, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),
('DAI-002', 'Alaska Evaporated Filled Milk', 'Brand: Alaska | Evaporated filled milk, 370g can', '5a5477c9-fbd4-4db3-b33e-05dad70ebef2', 'can', 1, 32.00, 48.00, 30, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),
('DAI-003', 'Magnolia Fresh Eggs', 'Brand: Magnolia | Farm fresh large eggs, tray of 30', '5a5477c9-fbd4-4db3-b33e-05dad70ebef2', 'tray', 1, 175.00, 245.00, 10, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),
('DAI-004', 'Anchor Butter Salted', 'Brand: Anchor | New Zealand salted butter, 250g block', '5a5477c9-fbd4-4db3-b33e-05dad70ebef2', 'pcs', 1, 155.00, 215.00, 15, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),

-- FROZEN FOODS (531afbfc-403b-48db-83ad-4b02babdbe23)
('FRZ-001', 'Purefoods Chicken Nuggets', 'Brand: Purefoods | Crispy chicken nuggets, 500g pack', '531afbfc-403b-48db-83ad-4b02babdbe23', 'pack', 1, 150.00, 215.00, 15, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),
('FRZ-002', 'San Miguel Chicken Franks', 'Brand: San Miguel | Chicken cocktail frankfurters, 250g', '531afbfc-403b-48db-83ad-4b02babdbe23', 'pack', 1, 80.00, 120.00, 20, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),

-- FRUITS & VEGETABLES (81d408bd-f5e7-437a-aceb-d0a5f1ee8002)
('FRV-001', 'Saba Banana', 'Local produce | Cooking banana (Saba variety), per kg', '81d408bd-f5e7-437a-aceb-d0a5f1ee8002', 'kg', 1, 28.00, 45.00, 20, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),
('FRV-002', 'Tomato', 'Local produce | Fresh red tomatoes, per kg', '81d408bd-f5e7-437a-aceb-d0a5f1ee8002', 'kg', 1, 50.00, 75.00, 15, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),
('FRV-003', 'White Onion', 'Local produce | Fresh white onions, per kg', '81d408bd-f5e7-437a-aceb-d0a5f1ee8002', 'kg', 1, 75.00, 110.00, 15, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),
('FRV-004', 'Garlic', 'Local produce | Fresh garlic bulbs, per kg', '81d408bd-f5e7-437a-aceb-d0a5f1ee8002', 'kg', 1, 95.00, 140.00, 10, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),

-- MEAT & SEAFOOD (4f48f12e-a054-4135-9d4d-6b457bb19c28)
('MSF-001', 'Chicken Breast Fillet', 'Local supplier | Boneless skinless chicken breast, per kg', '4f48f12e-a054-4135-9d4d-6b457bb19c28', 'kg', 1, 185.00, 265.00, 10, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),
('MSF-002', 'Pork Liempo (Belly)', 'Local supplier | Fresh pork belly slab, per kg', '4f48f12e-a054-4135-9d4d-6b457bb19c28', 'kg', 1, 220.00, 310.00, 10, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),
('MSF-003', 'Bangus (Milkfish) Boneless', 'Local supplier | Deboned milkfish, per kg', '4f48f12e-a054-4135-9d4d-6b457bb19c28', 'kg', 1, 165.00, 240.00, 10, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),

-- PERSONAL CARE (146d0ea7-e637-4386-afab-faf4294db214)
('PCS-001', 'Safeguard Bar Soap Classic White', 'Brand: Safeguard | Antibacterial bar soap, 135g', '146d0ea7-e637-4386-afab-faf4294db214', 'pcs', 1, 32.00, 48.00, 30, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),
('PCS-002', 'Head & Shoulders Shampoo Classic', 'Brand: Head & Shoulders | Anti-dandruff shampoo, 340mL', '146d0ea7-e637-4386-afab-faf4294db214', 'bottle', 0.34, 220.00, 315.00, 15, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),
('PCS-003', 'Colgate Cavity Protection Toothpaste', 'Brand: Colgate | Cavity protection toothpaste, 150g', '146d0ea7-e637-4386-afab-faf4294db214', 'pcs', 1, 65.00, 95.00, 20, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),

-- SNACKS & CONFECTIONERY (0f0bac77-c57a-4345-bc26-76dbe0223793)
('SNK-001', 'Nova Country Cheddar Snack', 'Brand: Nova | Cheddar-flavored corn snack, 78g', '0f0bac77-c57a-4345-bc26-76dbe0223793', 'pack', 1, 22.00, 35.00, 40, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),
('SNK-002', 'Piattos Cheese Potato Crisps', 'Brand: Piattos | Potato crisps cheese flavor, 85g', '0f0bac77-c57a-4345-bc26-76dbe0223793', 'pack', 1, 28.00, 42.00, 40, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),
('SNK-003', 'Ricoa Flat Tops Chocolate', 'Brand: Ricoa | Milk chocolate discs, 100g box', '0f0bac77-c57a-4345-bc26-76dbe0223793', 'box', 1, 45.00, 68.00, 25, true, '68a5b122-2542-4552-a296-69a595b7ce4b'),
('SNK-004', 'Clover Chips BBQ', 'Brand: Clover Chips | Barbecue-flavored corn chips, 90g', '0f0bac77-c57a-4345-bc26-76dbe0223793', 'pack', 1, 20.00, 32.00, 40, true, '68a5b122-2542-4552-a296-69a595b7ce4b')

ON CONFLICT (sku) DO NOTHING;
