CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'member');
CREATE TYPE user_status AS ENUM ('pending', 'active', 'expired', 'inactive');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'confirmed', 'failed', 'cancelled');
CREATE TYPE payment_method AS ENUM ('mpesa_stk', 'manual');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE event_status AS ENUM ('upcoming', 'ongoing', 'completed', 'cancelled');

-- ============================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  graduation_year INTEGER,
  course TEXT,
  county TEXT,
  membership_number TEXT UNIQUE,
  role user_role DEFAULT 'member',
  status user_status DEFAULT 'inactive',
  avatar_url TEXT,
  registration_source TEXT DEFAULT 'online' CHECK (registration_source IN ('online', 'manual')),
  needs_password_setup BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_phone CHECK (phone_number ~* '^(07|7|\+254|254)\d{8}$')
);

-- ============================================
-- 2. MEMBERSHIPS TABLE
-- ============================================
CREATE TABLE public.memberships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  payment_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create partial unique index for active memberships (only one active per user)
CREATE UNIQUE INDEX idx_memberships_user_active 
ON public.memberships(user_id) 
WHERE is_active = true;

-- ============================================
-- 3. PAYMENTS TABLE (STK Push focused)
-- ============================================
CREATE TABLE public.payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'KES',
  method payment_method DEFAULT 'mpesa_stk',
  payment_type TEXT NOT NULL CHECK (payment_type IN ('registration', 'renewal', 'event', 'merchandise')),
  
  -- STK Push fields
  checkout_request_id TEXT UNIQUE,
  merchant_request_id TEXT,
  mpesa_receipt_number TEXT,
  phone_number TEXT NOT NULL,
  account_reference TEXT,
  
  status payment_status DEFAULT 'pending',
  description TEXT,
  
  -- Timestamps
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  callback_data JSONB,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. PRODUCTS TABLE (MERCHANDISE)
-- ============================================
CREATE TABLE public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
  category TEXT CHECK (category IN ('tshirt', 'polo', 'hoodie', 'accessory', 'other')),
  is_active BOOLEAN DEFAULT TRUE,
  is_out_of_stock BOOLEAN DEFAULT FALSE,
  featured_image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. PRODUCT VARIANTS TABLE (Sizes & Colors)
-- ============================================
CREATE TABLE public.product_variants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  color_name TEXT NOT NULL,
  color_value TEXT NOT NULL, -- value used in code (e.g., 'navy', 'black')
  color_hex TEXT NOT NULL,
  size TEXT NOT NULL,
  sku TEXT UNIQUE,
  price_adjustment DECIMAL(10,2) DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, color_value, size)
);

-- ============================================
-- 6. PRODUCT IMAGES TABLE
-- ============================================
CREATE TABLE public.product_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. EVENTS TABLE
-- ============================================
CREATE TABLE public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date DATE,
  location TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  member_discount INTEGER DEFAULT 5 CHECK (member_discount BETWEEN 0 AND 100),
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  image_url TEXT,
  status event_status DEFAULT 'upcoming',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. EVENT REGISTRATIONS TABLE
-- ============================================
CREATE TABLE public.event_registrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  payment_id UUID REFERENCES public.payments(id),
  attended BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, event_id)
);

-- ============================================
-- 9. ORDERS TABLE (MERCHANDISE ORDERS)
-- ============================================
CREATE TABLE public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total DECIMAL(10,2) NOT NULL CHECK (total > 0),
  status order_status DEFAULT 'pending',
  order_number TEXT UNIQUE,
  shipping_address TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  notes TEXT,
  payment_id UUID REFERENCES public.payments(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. ADMIN LOGS TABLE
-- ============================================
CREATE TABLE public.admin_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. EMAIL LOGS TABLE
-- ============================================
CREATE TABLE public.email_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  email_type TEXT NOT NULL,
  status TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);
CREATE TYPE csr_event_type AS ENUM ('tree_planting', 'community_service', 'charity_drive', 'educational', 'health_campaign', 'other');

CREATE TABLE IF NOT EXISTS csr_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type csr_event_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date DATE NOT NULL,
  location TEXT NOT NULL,
  main_image_url TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS csr_event_photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  csr_event_id UUID REFERENCES csr_events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_csr_events_date ON csr_events(event_date DESC);
CREATE INDEX idx_csr_events_type ON csr_events(event_type);
CREATE INDEX idx_csr_events_published ON csr_events(is_published);
CREATE INDEX idx_csr_event_photos_event ON csr_event_photos(csr_event_id);
CREATE POLICY "Anyone can view published CSR events" 
  ON csr_events FOR SELECT 
  USING (is_published = true);

CREATE POLICY "Admin can manage CSR events" 
  ON csr_events FOR ALL 
  USING (auth.jwt() ->> 'role' = 'admin');

-- Policies for csr_event_photos
CREATE POLICY "Anyone can view CSR event photos" 
  ON csr_event_photos FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM csr_events 
    WHERE csr_events.id = csr_event_photos.csr_event_id 
    AND csr_events.is_published = true
  ));

CREATE POLICY "Admin can manage CSR event photos" 
  ON csr_event_photos FOR ALL 
  USING (auth.jwt() ->> 'role' = 'admin');
-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Profiles indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_phone ON public.profiles(phone_number);
CREATE INDEX idx_profiles_status ON public.profiles(status);
CREATE INDEX idx_profiles_membership_number ON public.profiles(membership_number);

-- Memberships indexes
CREATE INDEX idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX idx_memberships_expiry ON public.memberships(expiry_date) WHERE is_active = true;

-- Payments indexes
CREATE INDEX idx_payments_checkout_id ON public.payments(checkout_request_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_created_at ON public.payments(created_at);

-- Products indexes
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_out_of_stock ON public.products(is_out_of_stock) WHERE is_out_of_stock = TRUE;

-- Product variants indexes
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON public.product_variants(sku);
CREATE INDEX idx_product_variants_is_available ON public.product_variants(is_available);
CREATE INDEX idx_product_variants_color_value ON public.product_variants(color_value);

-- Events indexes
CREATE INDEX idx_events_date ON public.events(event_date) WHERE is_active = true;
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_is_active ON public.events(is_active);

-- Orders indexes
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON public.memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate membership numbers starting from 100196
CREATE OR REPLACE FUNCTION generate_membership_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  IF NEW.membership_number IS NULL THEN
    SELECT COALESCE(
      MAX(CAST(SUBSTRING(membership_number FROM '^(\d+)$') AS INTEGER)),
      100195
    ) + 1
    INTO next_number
    FROM public.profiles
    WHERE membership_number ~ '^\d+$';
    
    NEW.membership_number := next_number::TEXT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for membership number generation
CREATE TRIGGER trigger_generate_membership_number
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION generate_membership_number();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  date_part TEXT;
  seq_num INTEGER;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  
  SELECT COALESCE(MAX(SUBSTRING(order_number FROM '\d+$')::INTEGER), 0) + 1
  INTO seq_num
  FROM public.orders
  WHERE order_number LIKE 'ORD-' || date_part || '-%';
  
  RETURN 'ORD-' || date_part || '-' || LPAD(seq_num::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to set order number on insert
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for order number generation
CREATE TRIGGER set_order_number_trigger
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- Function to update product out_of_stock flag
CREATE OR REPLACE FUNCTION update_product_stock_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products p
  SET is_out_of_stock = NOT EXISTS (
    SELECT 1 
    FROM public.product_variants pv 
    WHERE pv.product_id = p.id 
    AND pv.is_available = TRUE 
    AND pv.stock_quantity > 0
  )
  WHERE p.id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for stock status updates
CREATE TRIGGER update_stock_status_trigger
AFTER INSERT OR UPDATE ON public.product_variants
FOR EACH ROW EXECUTE FUNCTION update_product_stock_status();

-- Function to decrement stock when merchandise payment is confirmed
CREATE OR REPLACE FUNCTION decrement_stock_on_order_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' AND NEW.payment_type = 'merchandise' THEN
    UPDATE public.product_variants pv
    SET stock_quantity = stock_quantity - oi.quantity,
        is_available = CASE 
          WHEN stock_quantity - oi.quantity <= 0 THEN FALSE 
          ELSE is_available 
        END
    FROM (
      SELECT 
        (item->>'variant_id')::UUID as variant_id,
        (item->>'quantity')::INTEGER as quantity
      FROM jsonb_array_elements(NEW.metadata->'items') AS item
    ) oi
    WHERE pv.id = oi.variant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for stock decrement
CREATE TRIGGER decrement_stock_trigger
AFTER UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION decrement_stock_on_order_confirmation();

-- Function to auto-activate user after payment
CREATE OR REPLACE FUNCTION activate_user_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    UPDATE public.profiles 
    SET status = 'active'::user_status
    WHERE id = NEW.user_id;
    
    IF NEW.payment_type = 'registration' THEN
      INSERT INTO public.memberships (
        user_id,
        start_date,
        expiry_date,
        is_active,
        payment_id
      ) VALUES (
        NEW.user_id,
        NOW()::DATE,
        (NOW() + INTERVAL '1 year')::DATE,
        true,
        NEW.id
      );
    END IF;
    
    IF NEW.payment_type = 'renewal' THEN
      UPDATE public.memberships 
      SET 
        expiry_date = (NOW() + INTERVAL '1 year')::DATE,
        is_active = true,
        updated_at = NOW()
      WHERE user_id = NEW.user_id AND is_active = true;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for user activation
CREATE TRIGGER trigger_activate_user_after_payment 
AFTER UPDATE OF status ON public.payments 
FOR EACH ROW EXECUTE FUNCTION activate_user_after_payment();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Helper function to check if user is admin (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());

-- Memberships RLS
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own memberships" ON public.memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all memberships" ON public.memberships FOR SELECT USING (public.is_admin());

-- Payments RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all payments" ON public.payments FOR ALL USING (public.is_admin());

-- Products RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins have full product access" ON public.products FOR ALL USING (public.is_admin());

-- Product variants RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view all variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Admins have full variant access" ON public.product_variants FOR ALL USING (public.is_admin());

-- Product images RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view product images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Admins have full image access" ON public.product_images FOR ALL USING (public.is_admin());

-- Events RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view active events" ON public.events FOR SELECT USING (is_active = true);
CREATE POLICY "Admins have full event access" ON public.events FOR ALL USING (public.is_admin());

-- Orders RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL USING (public.is_admin());

-- Event registrations RLS
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own registrations" ON public.event_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own registrations" ON public.event_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all registrations" ON public.event_registrations FOR ALL USING (public.is_admin());

-- Admin logs RLS (admins only)
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins only for admin logs" ON public.admin_logs FOR ALL USING (public.is_admin());

-- Email logs RLS (admins only)
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins only for email logs" ON public.email_logs FOR ALL USING (public.is_admin());

-- ============================================
-- MERCHANDISE DATA - Matching Frontend
-- ============================================

-- Insert Products
INSERT INTO public.products (name, slug, description, base_price, category, is_active, sort_order) VALUES
('T-Shirt', 't-shirt', 'Premium cotton CHRMAA t-shirt with embroidered logo', 1000, 'tshirt', true, 1),
('Polo Shirt', 'polo-shirt', 'Professional CHRMAA polo shirt with embroidered logo', 1500, 'polo', true, 2),
('Hoodie', 'hoodie', 'Comfortable CHRMAA hoodie with embroidered logo', 1800, 'hoodie', true, 3),
('Lapel Pin', 'lapel-pin', 'Elegant CHRMAA lapel pin for formal occasions', 1000, 'accessory', true, 4)
ON CONFLICT (slug) DO NOTHING;

-- Insert T-Shirt Variants
DO $$
DECLARE
  tshirt_id UUID;
BEGIN
  SELECT id INTO tshirt_id FROM public.products WHERE slug = 't-shirt';
  
  -- Black T-Shirts
  INSERT INTO public.product_variants (product_id, color_name, color_value, color_hex, size, stock_quantity, sku, image_url, is_available) VALUES
  (tshirt_id, 'Black', 'black', '#000000', 'S', 25, 'TSH-BLK-S', '/T-SHIRT.jpeg', true),
  (tshirt_id, 'Black', 'black', '#000000', 'M', 30, 'TSH-BLK-M', '/T-SHIRT.jpeg', true),
  (tshirt_id, 'Black', 'black', '#000000', 'L', 20, 'TSH-BLK-L', '/T-SHIRT.jpeg', true),
  (tshirt_id, 'Black', 'black', '#000000', 'XL', 15, 'TSH-BLK-XL', '/T-SHIRT.jpeg', true);
  
  -- White T-Shirts
  INSERT INTO public.product_variants (product_id, color_name, color_value, color_hex, size, stock_quantity, sku, image_url, is_available) VALUES
  (tshirt_id, 'White', 'white', '#ffffff', 'S', 28, 'TSH-WHT-S', '/whitetee.jpeg', true),
  (tshirt_id, 'White', 'white', '#ffffff', 'M', 35, 'TSH-WHT-M', '/whitetee.jpeg', true),
  (tshirt_id, 'White', 'white', '#ffffff', 'L', 22, 'TSH-WHT-L', '/whitetee.jpeg', true),
  (tshirt_id, 'White', 'white', '#ffffff', 'XL', 18, 'TSH-WHT-XL', '/whitetee.jpeg', true);
  
  -- Green T-Shirts
  INSERT INTO public.product_variants (product_id, color_name, color_value, color_hex, size, stock_quantity, sku, image_url, is_available) VALUES
  (tshirt_id, 'Green', 'green', '#16a34a', 'S', 20, 'TSH-GRN-S', '/T-SHIRT-black.jpeg', true),
  (tshirt_id, 'Green', 'green', '#16a34a', 'M', 25, 'TSH-GRN-M', '/T-SHIRT-black.jpeg', true),
  (tshirt_id, 'Green', 'green', '#16a34a', 'L', 18, 'TSH-GRN-L', '/T-SHIRT-black.jpeg', true),
  (tshirt_id, 'Green', 'green', '#16a34a', 'XL', 12, 'TSH-GRN-XL', '/T-SHIRT-black.jpeg', true);
  
  -- Red T-Shirts
  INSERT INTO public.product_variants (product_id, color_name, color_value, color_hex, size, stock_quantity, sku, image_url, is_available) VALUES
  (tshirt_id, 'Red', 'red', '#dc2626', 'S', 15, 'TSH-RED-S', '/T-SHIRT-red.jpeg', true),
  (tshirt_id, 'Red', 'red', '#dc2626', 'M', 20, 'TSH-RED-M', '/T-SHIRT-red.jpeg', true),
  (tshirt_id, 'Red', 'red', '#dc2626', 'L', 14, 'TSH-RED-L', '/T-SHIRT-red.jpeg', true),
  (tshirt_id, 'Red', 'red', '#dc2626', 'XL', 10, 'TSH-RED-XL', '/T-SHIRT-red.jpeg', true);
  
  -- Gray T-Shirts
  INSERT INTO public.product_variants (product_id, color_name, color_value, color_hex, size, stock_quantity, sku, image_url, is_available) VALUES
  (tshirt_id, 'Gray', 'gray', '#6b7280', 'S', 22, 'TSH-GRY-S', '/graytee.jpeg', true),
  (tshirt_id, 'Gray', 'gray', '#6b7280', 'M', 28, 'TSH-GRY-M', '/graytee.jpeg', true),
  (tshirt_id, 'Gray', 'gray', '#6b7280', 'L', 16, 'TSH-GRY-L', '/graytee.jpeg', true),
  (tshirt_id, 'Gray', 'gray', '#6b7280', 'XL', 12, 'TSH-GRY-XL', '/graytee.jpeg', true);
  
  -- Light Blue T-Shirts
  INSERT INTO public.product_variants (product_id, color_name, color_value, color_hex, size, stock_quantity, sku, image_url, is_available) VALUES
  (tshirt_id, 'Light Blue', 'lightblue', '#3b82f6', 'S', 18, 'TSH-LBL-S', '/bluetee.jpeg', true),
  (tshirt_id, 'Light Blue', 'lightblue', '#3b82f6', 'M', 24, 'TSH-LBL-M', '/bluetee.jpeg', true),
  (tshirt_id, 'Light Blue', 'lightblue', '#3b82f6', 'L', 15, 'TSH-LBL-L', '/bluetee.jpeg', true),
  (tshirt_id, 'Light Blue', 'lightblue', '#3b82f6', 'XL', 11, 'TSH-LBL-XL', '/bluetee.jpeg', true);
END $$;

-- Insert Polo Shirt Variants
DO $$
DECLARE
  polo_id UUID;
BEGIN
  SELECT id INTO polo_id FROM public.products WHERE slug = 'polo-shirt';
  
  -- Green Polos
  INSERT INTO public.product_variants (product_id, color_name, color_value, color_hex, size, stock_quantity, sku, image_url, is_available) VALUES
  (polo_id, 'Green', 'green', '#16a34a', 'S', 18, 'POL-GRN-S', '/POLO.jpeg', true),
  (polo_id, 'Green', 'green', '#16a34a', 'M', 22, 'POL-GRN-M', '/POLO.jpeg', true),
  (polo_id, 'Green', 'green', '#16a34a', 'L', 16, 'POL-GRN-L', '/POLO.jpeg', true),
  (polo_id, 'Green', 'green', '#16a34a', 'XL', 12, 'POL-GRN-XL', '/POLO.jpeg', true);
  
  -- White Polos
  INSERT INTO public.product_variants (product_id, color_name, color_value, color_hex, size, stock_quantity, sku, image_url, is_available) VALUES
  (polo_id, 'White', 'white', '#ffffff', 'S', 20, 'POL-WHT-S', '/T-SHIRT-white.jpeg', true),
  (polo_id, 'White', 'white', '#ffffff', 'M', 25, 'POL-WHT-M', '/T-SHIRT-white.jpeg', true),
  (polo_id, 'White', 'white', '#ffffff', 'L', 18, 'POL-WHT-L', '/T-SHIRT-white.jpeg', true),
  (polo_id, 'White', 'white', '#ffffff', 'XL', 14, 'POL-WHT-XL', '/T-SHIRT-white.jpeg', true);
  
  -- Black Polos
  INSERT INTO public.product_variants (product_id, color_name, color_value, color_hex, size, stock_quantity, sku, image_url, is_available) VALUES
  (polo_id, 'Black', 'black', '#000000', 'S', 16, 'POL-BLK-S', '/xx.jpeg', true),
  (polo_id, 'Black', 'black', '#000000', 'M', 20, 'POL-BLK-M', '/xx.jpeg', true),
  (polo_id, 'Black', 'black', '#000000', 'L', 14, 'POL-BLK-L', '/xx.jpeg', true),
  (polo_id, 'Black', 'black', '#000000', 'XL', 10, 'POL-BLK-XL', '/xx.jpeg', true);
  
  -- Red Polos
  INSERT INTO public.product_variants (product_id, color_name, color_value, color_hex, size, stock_quantity, sku, image_url, is_available) VALUES
  (polo_id, 'Red', 'red', '#dc2626', 'S', 14, 'POL-RED-S', '/chrmred polo.jpeg', true),
  (polo_id, 'Red', 'red', '#dc2626', 'M', 18, 'POL-RED-M', '/chrmred polo.jpeg', true),
  (polo_id, 'Red', 'red', '#dc2626', 'L', 12, 'POL-RED-L', '/chrmred polo.jpeg', true),
  (polo_id, 'Red', 'red', '#dc2626', 'XL', 8, 'POL-RED-XL', '/chrmred polo.jpeg', true);
  
  -- Gray Polos
  INSERT INTO public.product_variants (product_id, color_name, color_value, color_hex, size, stock_quantity, sku, image_url, is_available) VALUES
  (polo_id, 'Gray', 'gray', '#6b7280', 'S', 15, 'POL-GRY-S', '/POLO-gray.jpeg', true),
  (polo_id, 'Gray', 'gray', '#6b7280', 'M', 19, 'POL-GRY-M', '/POLO-gray.jpeg', true),
  (polo_id, 'Gray', 'gray', '#6b7280', 'L', 13, 'POL-GRY-L', '/POLO-gray.jpeg', true),
  (polo_id, 'Gray', 'gray', '#6b7280', 'XL', 9, 'POL-GRY-XL', '/POLO-gray.jpeg', true);
END $$;

-- Insert Hoodie Variants
DO $$
DECLARE
  hoodie_id UUID;
BEGIN
  SELECT id INTO hoodie_id FROM public.products WHERE slug = 'hoodie';
  
  -- Pink Hoodies
  INSERT INTO public.product_variants (product_id, color_name, color_value, color_hex, size, stock_quantity, sku, image_url, is_available) VALUES
  (hoodie_id, 'Pink', 'pink', '#ec4899', 'S', 12, 'HOD-PNK-S', '/Hoodie.jpeg', true),
  (hoodie_id, 'Pink', 'pink', '#ec4899', 'M', 16, 'HOD-PNK-M', '/Hoodie.jpeg', true),
  (hoodie_id, 'Pink', 'pink', '#ec4899', 'L', 10, 'HOD-PNK-L', '/Hoodie.jpeg', true),
  (hoodie_id, 'Pink', 'pink', '#ec4899', 'XL', 8, 'HOD-PNK-XL', '/Hoodie.jpeg', true);
  
  -- Black Hoodies
  INSERT INTO public.product_variants (product_id, color_name, color_value, color_hex, size, stock_quantity, sku, image_url, is_available) VALUES
  (hoodie_id, 'Black', 'black', '#000000', 'S', 14, 'HOD-BLK-S', '/blackhood.jpeg', true),
  (hoodie_id, 'Black', 'black', '#000000', 'M', 18, 'HOD-BLK-M', '/blackhood.jpeg', true),
  (hoodie_id, 'Black', 'black', '#000000', 'L', 12, 'HOD-BLK-L', '/blackhood.jpeg', true),
  (hoodie_id, 'Black', 'black', '#000000', 'XL', 9, 'HOD-BLK-XL', '/blackhood.jpeg', true);
  
  -- Gray Hoodies
  INSERT INTO public.product_variants (product_id, color_name, color_value, color_hex, size, stock_quantity, sku, image_url, is_available) VALUES
  (hoodie_id, 'Gray', 'gray', '#6b7280', 'M', 15, 'HOD-GRY-M', '/Hoodie-gray.jpeg', true),
  (hoodie_id, 'Gray', 'gray', '#6b7280', 'L', 11, 'HOD-GRY-L', '/Hoodie-gray.jpeg', true),
  (hoodie_id, 'Gray', 'gray', '#6b7280', 'XL', 7, 'HOD-GRY-XL', '/Hoodie-gray.jpeg', true);
  
  -- Light Blue Hoodies
  INSERT INTO public.product_variants (product_id, color_name, color_value, color_hex, size, stock_quantity, sku, image_url, is_available) VALUES
  (hoodie_id, 'Light Blue', 'lightblue', '#3b82f6', 'S', 10, 'HOD-LBL-S', '/Hoodie-blue.jpeg', true),
  (hoodie_id, 'Light Blue', 'lightblue', '#3b82f6', 'M', 14, 'HOD-LBL-M', '/Hoodie-blue.jpeg', true),
  (hoodie_id, 'Light Blue', 'lightblue', '#3b82f6', 'L', 9, 'HOD-LBL-L', '/Hoodie-blue.jpeg', true),
  (hoodie_id, 'Light Blue', 'lightblue', '#3b82f6', 'XL', 6, 'HOD-LBL-XL', '/Hoodie-blue.jpeg', true);
  
  -- Maroon Hoodies
  INSERT INTO public.product_variants (product_id, color_name, color_value, color_hex, size, stock_quantity, sku, image_url, is_available) VALUES
  (hoodie_id, 'Maroon', 'maroon', '#800000', 'S', 11, 'HOD-MAR-S', '/Hoodie-maroon.jpeg', true),
  (hoodie_id, 'Maroon', 'maroon', '#800000', 'M', 15, 'HOD-MAR-M', '/Hoodie-maroon.jpeg', true),
  (hoodie_id, 'Maroon', 'maroon', '#800000', 'L', 10, 'HOD-MAR-L', '/Hoodie-maroon.jpeg', true),
  (hoodie_id, 'Maroon', 'maroon', '#800000', 'XL', 7, 'HOD-MAR-XL', '/Hoodie-maroon.jpeg', true);
END $$;

-- Insert Lapel Pin Variant
DO $$
DECLARE
  pin_id UUID;
BEGIN
  SELECT id INTO pin_id FROM public.products WHERE slug = 'lapel-pin';
  
  INSERT INTO public.product_variants (product_id, color_name, color_value, color_hex, size, stock_quantity, sku, image_url, is_available) VALUES
  (pin_id, 'Gold', 'gold', '#d4af37', 'Standard', 150, 'PIN-GLD-STD', '/Lapel Pin.jpeg', true);
END $$;