-- Review feedback: tighten column types and add database-level constraints.

-- 1) Rename password -> password_hash (RENAME keeps existing data).
ALTER TABLE "users" RENAME COLUMN "password" TO "password_hash";

-- 2) Money columns: DECIMAL(12, 2).
ALTER TABLE "products"   ALTER COLUMN "price"          SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "customers"  ALTER COLUMN "balance"        SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "sales"      ALTER COLUMN "subtotal"       SET DATA TYPE DECIMAL(12,2),
                         ALTER COLUMN "discount_value" SET DATA TYPE DECIMAL(12,2),
                         ALTER COLUMN "total"          SET DATA TYPE DECIMAL(12,2),
                         ALTER COLUMN "paid_amount"    SET DATA TYPE DECIMAL(12,2),
                         ALTER COLUMN "remaining"      SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "sale_items" ALTER COLUMN "unit_price"     SET DATA TYPE DECIMAL(12,2),
                         ALTER COLUMN "line_total"     SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "payments"   ALTER COLUMN "amount"         SET DATA TYPE DECIMAL(12,2);

-- 3) Quantity columns: DECIMAL(12, 3).
ALTER TABLE "stock"           ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(12,3);
ALTER TABLE "stock_movements" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(12,3);
ALTER TABLE "sale_items"      ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(12,3);

-- 4) Timestamps: TIMESTAMPTZ. Existing values were written by Prisma as UTC.
ALTER TABLE "users"           ALTER COLUMN "created_at"    SET DATA TYPE TIMESTAMPTZ(3) USING "created_at"    AT TIME ZONE 'UTC';
ALTER TABLE "suppliers"       ALTER COLUMN "created_at"    SET DATA TYPE TIMESTAMPTZ(3) USING "created_at"    AT TIME ZONE 'UTC';
ALTER TABLE "customers"       ALTER COLUMN "created_at"    SET DATA TYPE TIMESTAMPTZ(3) USING "created_at"    AT TIME ZONE 'UTC';
ALTER TABLE "stock_movements" ALTER COLUMN "movement_date" SET DATA TYPE TIMESTAMPTZ(3) USING "movement_date" AT TIME ZONE 'UTC';
ALTER TABLE "sales"           ALTER COLUMN "sale_date"     SET DATA TYPE TIMESTAMPTZ(3) USING "sale_date"     AT TIME ZONE 'UTC';
ALTER TABLE "payments"        ALTER COLUMN "payment_date"  SET DATA TYPE TIMESTAMPTZ(3) USING "payment_date"  AT TIME ZONE 'UTC';

-- 5) CHECK constraints (Prisma cannot express these in schema.prisma).
ALTER TABLE "products"
  ADD CONSTRAINT "products_price_non_negative" CHECK ("price" >= 0);

ALTER TABLE "stock"
  ADD CONSTRAINT "stock_quantity_non_negative" CHECK ("quantity" >= 0);

ALTER TABLE "stock_movements"
  ADD CONSTRAINT "stock_movements_quantity_non_negative" CHECK ("quantity" >= 0),
  ADD CONSTRAINT "stock_movements_locations_match_type" CHECK (
    ("type" = 'in'       AND "to_location_id" IS NOT NULL)
    OR ("type" = 'out'      AND "from_location_id" IS NOT NULL)
    OR ("type" = 'TRANSFER' AND "from_location_id" IS NOT NULL AND "to_location_id" IS NOT NULL)
  );

ALTER TABLE "sales"
  ADD CONSTRAINT "sales_subtotal_non_negative"       CHECK ("subtotal" >= 0),
  ADD CONSTRAINT "sales_discount_value_non_negative" CHECK ("discount_value" >= 0),
  ADD CONSTRAINT "sales_total_non_negative"          CHECK ("total" >= 0),
  ADD CONSTRAINT "sales_paid_amount_non_negative"    CHECK ("paid_amount" >= 0),
  ADD CONSTRAINT "sales_remaining_non_negative"      CHECK ("remaining" >= 0);

ALTER TABLE "sale_items"
  ADD CONSTRAINT "sale_items_quantity_non_negative"   CHECK ("quantity" >= 0),
  ADD CONSTRAINT "sale_items_unit_price_non_negative" CHECK ("unit_price" >= 0),
  ADD CONSTRAINT "sale_items_line_total_non_negative" CHECK ("line_total" >= 0);

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_amount_non_negative" CHECK ("amount" >= 0);
