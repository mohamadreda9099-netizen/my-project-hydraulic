import "dotenv/config";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const seeded = await prisma.$transaction(
    async (tx) => {
      const demoUserEmail = "demo.manager@hydraulic.example";
      const seedSaleDate = new Date("2026-01-15T10:00:00.000Z");
      const existingDemoUser = await tx.user.findUnique({
        where: { email: demoUserEmail },
      });

      if (
        existingDemoUser &&
        (await tx.sale.findFirst({
          where: { userId: existingDemoUser.id, saleDate: seedSaleDate },
          select: { id: true },
        }))
      ) {
        return false;
      }

      const [hydraulics, filters, workshop, warehouse] = await Promise.all([
        tx.category.upsert({
          where: { name: "Hydraulic Components (Demo)" },
          update: {},
          create: { name: "Hydraulic Components (Demo)" },
        }),
        tx.category.upsert({
          where: { name: "Maintenance Parts (Demo)" },
          update: {},
          create: { name: "Maintenance Parts (Demo)" },
        }),
        tx.location.upsert({
          where: { name: "Demo Workshop" },
          update: { type: "SHOP" },
          create: { name: "Demo Workshop", type: "SHOP" },
        }),
        tx.location.upsert({
          where: { name: "Demo Warehouse" },
          update: { type: "WAREHOUSE" },
          create: { name: "Demo Warehouse", type: "WAREHOUSE" },
        }),
      ]);

      const [manager, cashier, supplier] = await Promise.all([
        tx.user.upsert({
          where: { email: demoUserEmail },
          update: {},
          create: {
            name: "Demo Manager",
            email: demoUserEmail,
            password: "demo-password-not-for-login",
          },
        }),
        tx.user.upsert({
          where: { email: "demo.cashier@hydraulic.example" },
          update: {},
          create: {
            name: "Demo Cashier",
            email: "demo.cashier@hydraulic.example",
            password: "demo-password-not-for-login",
          },
        }),
        tx.supplier.upsert({
          where: { email: "sales@demo-hydraulics.example" },
          update: {},
          create: {
            name: "Demo Hydraulics Supply",
            phone: "+1-555-0101",
            email: "sales@demo-hydraulics.example",
          },
        }),
      ]);

      const [hose, sealKit, oilFilter] = await Promise.all([
        tx.product.upsert({
          where: { productCode: "DEMO-HOSE-01" },
          update: {
            name: "Hydraulic Hose - Demo",
            categoryId: hydraulics.id,
            price: 25.5,
            unit: "piece",
          },
          create: {
            name: "Hydraulic Hose - Demo",
            productCode: "DEMO-HOSE-01",
            categoryId: hydraulics.id,
            price: 25.5,
            unit: "piece",
          },
        }),
        tx.product.upsert({
          where: { productCode: "DEMO-SEAL-01" },
          update: {
            name: "Cylinder Seal Kit - Demo",
            categoryId: hydraulics.id,
            price: 12,
            unit: "kit",
          },
          create: {
            name: "Cylinder Seal Kit - Demo",
            productCode: "DEMO-SEAL-01",
            categoryId: hydraulics.id,
            price: 12,
            unit: "kit",
          },
        }),
        tx.product.upsert({
          where: { productCode: "DEMO-FILTER-01" },
          update: {
            name: "Hydraulic Oil Filter - Demo",
            categoryId: filters.id,
            price: 8.75,
            unit: "piece",
          },
          create: {
            name: "Hydraulic Oil Filter - Demo",
            productCode: "DEMO-FILTER-01",
            categoryId: filters.id,
            price: 8.75,
            unit: "piece",
          },
        }),
      ]);

      const [laila, omar, noor, accountCustomer] = await Promise.all([
        tx.customer.create({
          data: {
            name: "Laila Haddad (Demo)",
            phone: "+1-555-0201",
            balance: 36.7,
          },
        }),
        tx.customer.create({
          data: {
            name: "Omar Nasser (Demo)",
            phone: "+1-555-0202",
            balance: 0,
          },
        }),
        tx.customer.create({
          data: {
            name: "Noor Saleh (Demo)",
            phone: "+1-555-0203",
            balance: 25.5,
          },
        }),
        tx.customer.create({
          data: {
            name: "Account Customer (Demo)",
            phone: null,
            balance: 10,
          },
        }),
      ]);

      await Promise.all([
        tx.stock.upsert({
          where: {
            productId_locationId: {
              productId: hose.id,
              locationId: warehouse.id,
            },
          },
          update: { quantity: 35 },
          create: {
            productId: hose.id,
            locationId: warehouse.id,
            quantity: 35,
          },
        }),
        tx.stock.upsert({
          where: {
            productId_locationId: {
              productId: hose.id,
              locationId: workshop.id,
            },
          },
          update: { quantity: 8 },
          create: { productId: hose.id, locationId: workshop.id, quantity: 8 },
        }),
        tx.stock.upsert({
          where: {
            productId_locationId: {
              productId: sealKit.id,
              locationId: warehouse.id,
            },
          },
          update: { quantity: 40 },
          create: {
            productId: sealKit.id,
            locationId: warehouse.id,
            quantity: 40,
          },
        }),
        tx.stock.upsert({
          where: {
            productId_locationId: {
              productId: sealKit.id,
              locationId: workshop.id,
            },
          },
          update: { quantity: 15 },
          create: {
            productId: sealKit.id,
            locationId: workshop.id,
            quantity: 15,
          },
        }),
        tx.stock.upsert({
          where: {
            productId_locationId: {
              productId: oilFilter.id,
              locationId: warehouse.id,
            },
          },
          update: { quantity: 60 },
          create: {
            productId: oilFilter.id,
            locationId: warehouse.id,
            quantity: 60,
          },
        }),
        tx.stock.upsert({
          where: {
            productId_locationId: {
              productId: oilFilter.id,
              locationId: workshop.id,
            },
          },
          update: { quantity: 20 },
          create: {
            productId: oilFilter.id,
            locationId: workshop.id,
            quantity: 20,
          },
        }),
      ]);

      await tx.stockMovement.createMany({
        data: [
          {
            productId: hose.id,
            type: "INCOMING",
            quantity: 50,
            toLocationId: warehouse.id,
            supplierId: supplier.id,
            userId: manager.id,
            movementDate: new Date("2026-01-10T09:00:00.000Z"),
          },
          {
            productId: sealKit.id,
            type: "TRANSFER",
            quantity: 10,
            fromLocationId: warehouse.id,
            toLocationId: workshop.id,
            userId: manager.id,
            movementDate: new Date("2026-01-11T11:30:00.000Z"),
          },
          {
            productId: oilFilter.id,
            type: "OUTGOING",
            quantity: 2,
            fromLocationId: workshop.id,
            userId: manager.id,
            movementDate: new Date("2026-01-12T14:15:00.000Z"),
          },
          {
            productId: oilFilter.id,
            type: "INCOMING",
            quantity: 24,
            toLocationId: workshop.id,
            supplierId: supplier.id,
            userId: manager.id,
            movementDate: new Date("2026-01-13T08:45:00.000Z"),
          },
        ],
      });

      const partialSale = await tx.sale.create({
        data: {
          customerId: laila.id,
          userId: manager.id,
          saleDate: seedSaleDate,
          subtotal: 63,
          discountType: "PERCENT",
          discountValue: 10,
          total: 56.7,
          paidAmount: 20,
          remaining: 36.7,
          items: {
            create: [
              {
                productId: hose.id,
                locationId: workshop.id,
                quantity: 2,
                unitPrice: 25.5,
                lineTotal: 51,
              },
              {
                productId: sealKit.id,
                locationId: workshop.id,
                quantity: 1,
                unitPrice: 12,
                lineTotal: 12,
              },
            ],
          },
        },
      });

      const paidSale = await tx.sale.create({
        data: {
          customerId: omar.id,
          userId: cashier.id,
          saleDate: new Date("2026-01-16T12:30:00.000Z"),
          subtotal: 38.25,
          discountType: "FIXED",
          discountValue: 5,
          total: 33.25,
          paidAmount: 33.25,
          remaining: 0,
          items: {
            create: [
              {
                productId: oilFilter.id,
                locationId: workshop.id,
                quantity: 3,
                unitPrice: 8.75,
                lineTotal: 26.25,
              },
              {
                productId: sealKit.id,
                locationId: workshop.id,
                quantity: 1,
                unitPrice: 12,
                lineTotal: 12,
              },
            ],
          },
        },
      });

      await tx.sale.create({
        data: {
          customerId: noor.id,
          userId: manager.id,
          saleDate: new Date("2026-01-17T15:45:00.000Z"),
          subtotal: 25.5,
          discountType: null,
          discountValue: 0,
          total: 25.5,
          paidAmount: 0,
          remaining: 25.5,
          items: {
            create: {
              productId: hose.id,
              locationId: workshop.id,
              quantity: 1,
              unitPrice: 25.5,
              lineTotal: 25.5,
            },
          },
        },
      });

      await tx.sale.create({
        data: {
          customerId: null,
          userId: cashier.id,
          saleDate: new Date("2026-01-18T10:20:00.000Z"),
          subtotal: 17.5,
          discountType: null,
          discountValue: 0,
          total: 17.5,
          paidAmount: 17.5,
          remaining: 0,
          items: {
            create: {
              productId: oilFilter.id,
              locationId: workshop.id,
              quantity: 2,
              unitPrice: 8.75,
              lineTotal: 17.5,
            },
          },
        },
      });

      await tx.payment.createMany({
        data: [
          {
            customerId: laila.id,
            saleId: partialSale.id,
            amount: 20,
            method: "CASH",
            userId: cashier.id,
            paymentDate: new Date("2026-01-15T10:05:00.000Z"),
          },
          {
            customerId: omar.id,
            saleId: paidSale.id,
            amount: 33.25,
            method: "WHISH",
            userId: cashier.id,
            paymentDate: new Date("2026-01-16T12:35:00.000Z"),
          },
          {
            customerId: accountCustomer.id,
            saleId: null,
            amount: 10,
            method: "CASH",
            userId: manager.id,
            paymentDate: new Date("2026-01-18T16:00:00.000Z"),
          },
        ],
      });

      return true;
    },
    {
      maxWait: 10000,
      timeout: 60000,
    },
  );

  console.info(
    seeded ? "Demo data seeded successfully." : "Demo data is already seeded.",
  );
}

main()
  .catch((error: unknown) => {
    console.error("Failed to seed the database:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
