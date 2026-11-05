import "dotenv/config";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const num = (v: unknown) => Number(v);
const round2 = (n: number) => Math.round(n * 100) / 100;

async function main() {
  // 1) Row counts per table
  console.log("\n=== 1) Row counts ===");
  console.table({
    categories: await prisma.category.count(),
    locations: await prisma.location.count(),
    users: await prisma.user.count(),
    suppliers: await prisma.supplier.count(),
    products: await prisma.product.count(),
    stock: await prisma.stock.count(),
    stockMovements: await prisma.stockMovement.count(),
    customers: await prisma.customer.count(),
    sales: await prisma.sale.count(),
    payments: await prisma.payment.count(),
  });

  // 2) Stock of each product at each location (FR 1)
  console.log("\n=== 2) Stock per product per location ===");
  const [stockRows, products, locations] = await Promise.all([
    prisma.stock.findMany(),
    prisma.product.findMany(),
    prisma.location.findMany(),
  ]);
  const productById = new Map(products.map((p) => [p.id, p]));
  const locationById = new Map(locations.map((l) => [l.id, l]));
  console.table(
    stockRows.map((s) => ({
      product: productById.get(s.productId)?.name,
      code: productById.get(s.productId)?.productCode,
      location: locationById.get(s.locationId)?.name,
      quantity: s.quantity,
    })),
  );

  // 3) Search a product by name or code (FR 3)
  console.log('\n=== 3) Search "hose" by name or code ===');
  const found = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: "hose", mode: "insensitive" } },
        { productCode: { contains: "hose", mode: "insensitive" } },
      ],
    },
  });
  console.table(found.map((p) => ({ name: p.name, code: p.productCode, price: num(p.price) })));

  // 4) Customers with outstanding debt (FR 19)
  console.log("\n=== 4) Customers with outstanding debt ===");
  const debtors = await prisma.customer.findMany({
    where: { balance: { gt: 0 } },
    orderBy: { balance: "desc" },
  });
  console.table(debtors.map((c) => ({ name: c.name, balance: num(c.balance) })));

  // 5) Sales totals
  console.log("\n=== 5) Sales totals ===");
  const totals = await prisma.sale.aggregate({
    _sum: { subtotal: true, total: true, paidAmount: true, remaining: true },
    _count: true,
  });
  console.table({
    sales: totals._count,
    subtotal: num(totals._sum.subtotal),
    total: num(totals._sum.total),
    paid: num(totals._sum.paidAmount),
    remaining: num(totals._sum.remaining),
  });

  // 6) Invoice math check (FR 23 to 28)
  console.log("\n=== 6) Invoice math check ===");
  const sales = await prisma.sale.findMany({
    include: { items: true },
    orderBy: { saleDate: "asc" },
  });
  const checks = sales.map((s) => {
    const itemsSum = round2(s.items.reduce((a, i) => a + num(i.lineTotal), 0));
    const subtotal = num(s.subtotal);
    const discount =
      s.discountType === "PERCENT"
        ? round2((subtotal * num(s.discountValue)) / 100)
        : s.discountType === "FIXED"
          ? num(s.discountValue)
          : 0;
    return {
      date: s.saleDate.toISOString().slice(0, 10),
      itemsSum,
      subtotal,
      totalOk: round2(subtotal - discount) === num(s.total),
      remainingOk: round2(num(s.total) - num(s.paidAmount)) === num(s.remaining),
      itemsOk: itemsSum === subtotal,
    };
  });
  console.table(checks);

  // 7) Stock movements by type
  console.log("\n=== 7) Stock movements by type ===");
  const moves = await prisma.stockMovement.groupBy({
    by: ["type"],
    _sum: { quantity: true },
    _count: true,
  });
  console.table(
    moves.map((m) => ({ type: m.type, count: m._count, quantity: m._sum.quantity })),
  );

  // 8) Debt consistency: customer balance vs unpaid sales
  console.log("\n=== 8) Customer balance vs sum of remaining on their sales ===");
  const customers = await prisma.customer.findMany();
  const remainingByCustomer = await prisma.sale.groupBy({
    by: ["customerId"],
    _sum: { remaining: true },
  });
  const remMap = new Map(
    remainingByCustomer.map((r) => [r.customerId, num(r._sum.remaining)]),
  );
  console.table(
    customers.map((c) => ({
      name: c.name,
      balance: num(c.balance),
      salesRemaining: remMap.get(c.id) ?? 0,
      match: num(c.balance) === (remMap.get(c.id) ?? 0),
    })),
  );
}

main()
  .catch((error: unknown) => {
    console.error("Query test failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });