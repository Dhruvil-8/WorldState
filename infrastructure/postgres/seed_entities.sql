-- ============================================================
-- WorldState — Ontology Seed Entities
-- High-grade, multi-polar tracked world entities
-- ============================================================

INSERT INTO entities (id, entity_type, name, canonical_name, aliases, description, importance, active)
VALUES
    -- ── Countries ───────────────────────────────────────────
    (uuid_generate_v4(), 'country', 'United States', 'United States of America', '{"USA", "US", "United States"}', 
     'Planetary superpower, key driver of global financial asset pricing, technology innovation center, and defense infrastructure leader.', 100, true),
     
    (uuid_generate_v4(), 'country', 'China', 'People''s Republic of China', '{"PRC", "China", "Mainland China"}', 
     'Global manufacturing engine, supply chain hub, second largest economy, and dominant processor of critical minerals and green energy supply chains.', 100, true),
     
    (uuid_generate_v4(), 'country', 'India', 'Republic of India', '{"India", "Bharat", "South Asia"}', 
     'Rapid-growth global economic power, key Indo-Pacific security node, major digital services hub, and critical voice of the Global South.', 94, true),
     
    (uuid_generate_v4(), 'country', 'Germany', 'Federal Republic of Germany', '{"Germany", "DE", "Deutschland"}', 
     'Industrial heart of Europe, leading exporter of automotive and industrial machinery, and primary driver of EU economic policy.', 88, true),
     
    (uuid_generate_v4(), 'country', 'Russia', 'Russian Federation', '{"Russia", "RU", "Russian Federation"}', 
     'Major global energy supplier, leading nuclear power, and critical geopolitical player in Eurasian security and strategic commodity supply.', 90, true),
     
    (uuid_generate_v4(), 'country', 'Saudi Arabia', 'Kingdom of Saudi Arabia', '{"KSA", "Saudi", "Saudi Arabia"}', 
     'Swing producer in the global oil market, leader of OPEC, and rapidly diversifying investment power in the Middle East.', 86, true),
     
    (uuid_generate_v4(), 'country', 'Brazil', 'Federative Republic of Brazil', '{"Brazil", "BR", "Brasil"}', 
     'Agricultural powerhouse, primary regional leader in South America, and major global supplier of iron ore, soy, and deepwater crude.', 85, true),
     
    (uuid_generate_v4(), 'country', 'Japan', 'Japan', '{"Japan", "JP", "Nippon"}', 
     'Third largest global economy, high-tech industrial exporter, critical Pacific security ally, and leading holder of global public debt.', 90, true),
     
    (uuid_generate_v4(), 'country', 'South Korea', 'Republic of Korea', '{"South Korea", "ROK", "Korea"}', 
     'High-tech export hub, leading developer of memory chips, displays, and consumer electronics, and key security node in East Asia.', 88, true),
     
    (uuid_generate_v4(), 'country', 'France', 'French Republic', '{"France", "FR", "French Republic"}', 
     'Nuclear-armed permanent UN Security Council member, leading European defense power, and major diplomatic voice in EU integration.', 87, true),
     
    (uuid_generate_v4(), 'country', 'Singapore', 'Republic of Singapore', '{"Singapore", "SG"}', 
     'Critical financial node, logistics pivot point of Southeast Asia, and major global maritime transit hub.', 84, true),
     
    (uuid_generate_v4(), 'country', 'South Africa', 'Republic of South Africa', '{"South Africa", "ZA", "RSA"}', 
     'Leading African economic power, rich supplier of platinum-group metals, and key southern hemisphere diplomatic coordinator.', 80, true),
     
    (uuid_generate_v4(), 'country', 'United Kingdom', 'United Kingdom of Great Britain and Northern Ireland', '{"UK", "Britain", "United Kingdom"}', 
     'Permanent UN Security Council member, key NATO defense node, major global financial hub (London), and advanced research center.', 89, true),

    -- ── Companies ───────────────────────────────────────────
    (uuid_generate_v4(), 'company', 'TSMC', 'Taiwan Semiconductor Manufacturing Company', '{"TSMC", "Taiwan Semi"}', 
     'The world''s leading dedicated independent semiconductor foundry, manufacturing over 90% of the world''s most advanced microchips.', 93, true),
     
    (uuid_generate_v4(), 'company', 'ASML', 'ASML Holding N.V.', '{"ASML", "ASML Holding"}', 
     'Dutch multinational corporation and sole manufacturer of Extreme Ultraviolet (EUV) lithography systems required for next-gen node fabrication.', 92, true),
     
    (uuid_generate_v4(), 'company', 'NVIDIA', 'NVIDIA Corporation', '{"NVDA", "NVIDIA"}', 
     'Dominant global developer of high-performance graphic processing units (GPUs) and CUDA software driving international AI infrastructure.', 90, true),
     
    (uuid_generate_v4(), 'company', 'Saudi Aramco', 'Saudi Arabian Oil Group', '{"Aramco", "Saudi Aramco"}', 
     'The world''s largest oil producing company, serving as the primary source of hydrocarbon revenue for the Kingdom of Saudi Arabia.', 88, true),
     
    (uuid_generate_v4(), 'company', 'Reliance Industries', 'Reliance Industries Limited', '{"RIL", "Reliance"}', 
     'Indian multinational conglomerate, owning the world''s largest oil refining complex at Jamnagar and leading telecom networks.', 82, true),
     
    (uuid_generate_v4(), 'company', 'Petrobras', 'Petróleo Brasileiro S.A.', '{"Petrobras", "Petroleo Brasileiro"}', 
     'Brazilian state-controlled multinational energy corporation specializing in deepwater and ultra-deepwater pre-salt oil extraction.', 80, true),

    -- ── Commodities ─────────────────────────────────────────
    (uuid_generate_v4(), 'commodity', 'Crude Oil', 'Crude Oil (Brent / WTI)', '{"Oil", "Brent", "WTI", "Petroleum"}', 
     'Primary energy commodity, driving international logistics networks, chemical manufacture, and geopolitical alliances.', 88, true),
     
    (uuid_generate_v4(), 'commodity', 'Natural Gas', 'Natural Gas (LNG / Henry Hub)', '{"Gas", "Natural Gas", "LNG"}', 
     'Critical energy transition resource and primary fuel for industrial heating, fertilizer production, and electricity grids.', 86, true),
     
    (uuid_generate_v4(), 'commodity', 'Rare Earths', 'Rare Earth Elements', '{"REE", "Neodymium", "Dysprosium"}', 
     'Group of seventeen chemical elements critical to aerospace, electric vehicle motors, wind turbines, and military electronics.', 85, true),
     
    (uuid_generate_v4(), 'commodity', 'Wheat', 'Agricultural Wheat grains', '{"Wheat", "Grain", "Wheat Futures"}', 
     'Essential dietary staple, serving as a primary indicator of global food security, climate impact, and trade stability.', 82, true),
     
    (uuid_generate_v4(), 'commodity', 'Copper', 'Copper Metal', '{"Copper", "Cu"}', 
     'Highly conductive industrial metal essential for electrical wiring, green energy grids, EV batteries, and telecommunication networks.', 84, true),
     
    (uuid_generate_v4(), 'commodity', 'Lithium', 'Lithium Metal', '{"Lithium", "Li"}', 
     'Critical alkali metal serving as the foundational element for rechargeable lithium-ion batteries in electric vehicles and consumer tech.', 83, true),

    -- ── Chokepoints, Shipping & Ports ───────────────────────
    (uuid_generate_v4(), 'shipping_route', 'Strait of Hormuz', 'Strait of Hormuz', '{"Hormuz Strait", "Hormuz"}', 
     'The world''s most critical maritime oil transit chokepoint, handling over 20% of global petroleum consumption transit daily.', 87, true),
     
    (uuid_generate_v4(), 'shipping_route', 'Malacca Strait', 'Strait of Malacca', '{"Malacca Strait", "Malacca"}', 
     'Primary maritime channel linking the Indian Ocean with the Pacific, serving as the main shipping route for energy imports into East Asia.', 86, true),
     
    (uuid_generate_v4(), 'shipping_route', 'Suez Canal', 'Suez Canal', '{"Suez"}', 
     'Critical Egyptian artificial sea-level waterway linking the Mediterranean to the Red Sea, handling roughly 12% of global trade transit.', 85, true),
     
    (uuid_generate_v4(), 'port', 'Port of Rotterdam', 'Port of Rotterdam', '{"Rotterdam Port"}', 
     'Largest seaport in Europe, serving as the main logistical entryway for raw materials and containers into continental Europe.', 82, true),
     
    (uuid_generate_v4(), 'port', 'Port of Singapore', 'Port of Singapore', '{"Singapore Port"}', 
     'Leading global transshipment hub, handling critical cargo shipping routes between Europe, the Middle East, and East Asia.', 83, true),

    -- ── Organizations ───────────────────────────────────────
    (uuid_generate_v4(), 'organization', 'United Nations', 'United Nations', '{"UN", "United Nations"}', 
     'International organization founded to maintain international peace and security, develop friendly relations among nations, and coordinate cooperation.', 85, true),
     
    (uuid_generate_v4(), 'organization', 'European Union', 'European Union', '{"EU", "European Union"}', 
     'Supranational political and economic union of 27 European member states, representing the world''s largest unified single market block.', 88, true),
     
    (uuid_generate_v4(), 'organization', 'BRICS', 'BRICS Alliance', '{"BRICS", "BRICS+"}', 
     'Intergovernmental organization promoting economic and political cooperation among leading emerging economies.', 83, true),
     
    (uuid_generate_v4(), 'organization', 'OPEC', 'Organization of the Petroleum Exporting Countries', '{"OPEC", "OPEC+"}', 
     'Cartel of 12 oil-exporting nations coordinating petroleum policies to manage global oil prices and ensure market supply controls.', 86, true),

    -- ── Financial Assets / Indices ──────────────────────────
    (uuid_generate_v4(), 'financial_asset', 'S&P 500 Index', 'S&P 500 Index', '{"SPX", "S&P 500", "US Equities"}', 
     'US stock market index tracking the performance of 500 large companies listed on stock exchanges in the United States.', 92, true),
     
    (uuid_generate_v4(), 'financial_asset', 'PHLX Semiconductor Index', 'PHLX Semiconductor Index', '{"SOX", "Semiconductors", "Silicon Index"}', 
     'US stock market index tracking semiconductor manufacturing, design, and distribution companies.', 86, true),
     
    (uuid_generate_v4(), 'financial_asset', 'Nifty 50 Index', 'Nifty 50 Index', '{"Nifty 50", "NSE", "India Equities"}', 
     'Indian stock market index tracking the weighted average of 50 largest Indian companies listed on the National Stock Exchange.', 90, true),
     
    (uuid_generate_v4(), 'financial_asset', 'DAX Index', 'DAX Index', '{"DAX", "Germany Equities", "Frankfurt Index"}', 
     'German stock market index tracking the performance of 40 major blue-chip companies trading on the Frankfurt Stock Exchange.', 88, true),
     
    (uuid_generate_v4(), 'financial_asset', 'Nikkei 225 Index', 'Nikkei 225 Index', '{"Nikkei", "Japan Equities", "Tokyo Index"}', 
     'Japanese stock market index tracking the performance of 225 large, publicly owned companies in Japan.', 87, true),
     
    (uuid_generate_v4(), 'financial_asset', 'Hang Seng Index', 'Hang Seng Index', '{"HSI", "Hong Kong Equities", "China Offshore"}', 
     'Hong Kong stock market index tracking the performance of the largest companies listed on the Hong Kong Stock Exchange.', 86, true),
     
    (uuid_generate_v4(), 'financial_asset', 'FTSE 100 Index', 'FTSE 100 Index', '{"FTSE", "UK Equities", "Footsie"}', 
     'British stock market index tracking the performance of 100 highly capitalized companies listed on the London Stock Exchange.', 85, true),
     
    (uuid_generate_v4(), 'financial_asset', 'Ibovespa Index', 'Ibovespa Index', '{"Ibovespa", "Brazil Equities", "Bovespa"}', 
     'Brazilian stock market index tracking the performance of the most liquid and capitalized stocks on the B3 Exchange.', 80, true)

ON CONFLICT (canonical_name, entity_type) DO NOTHING;
