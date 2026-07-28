"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { toNumber } from "@/lib/format";

function firstOfMonthUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function addMonthsUTC(d: Date, n: number) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

/**
 * Generates (or refreshes) monthly DepreciationEntry rows for every eligible
 * asset (has purchaseCost, purchaseDate, usefulLifeYears, not DISPOSED),
 * covering every month from the asset's purchase month through the current
 * month. Idempotent: months that already have an entry are used as the
 * carry-forward book value rather than being recomputed from scratch, so
 * running this repeatedly (even across different points in time) is safe.
 */
export async function generateDepreciationEntries() {
  const assets = await prisma.asset.findMany({
    where: {
      status: { not: "DISPOSED" },
      purchaseCost: { not: null },
      purchaseDate: { not: null },
      usefulLifeYears: { not: null },
    },
  });

  const now = firstOfMonthUTC(new Date());
  let assetsProcessed = 0;
  let entriesCreated = 0;

  for (const asset of assets) {
    if (!asset.purchaseCost || !asset.purchaseDate || !asset.usefulLifeYears) continue;

    const purchaseCost = toNumber(asset.purchaseCost);
    const salvage = toNumber(asset.salvageValue);
    const usefulLifeMonths = asset.usefulLifeYears * 12;
    if (usefulLifeMonths <= 0 || purchaseCost <= salvage) continue;

    const start = firstOfMonthUTC(asset.purchaseDate);
    if (start.getTime() > now.getTime()) continue; // purchased in the future, nothing to generate yet

    const existing = await prisma.depreciationEntry.findMany({
      where: { assetId: asset.id },
      orderBy: { period: "asc" },
    });
    const existingMap = new Map(existing.map((e) => [e.period.getTime(), e]));

    const straightLineMonthly = (purchaseCost - salvage) / usefulLifeMonths;
    const decliningRate = 2 / usefulLifeMonths;

    let runningBookValue = purchaseCost;
    let period = start;
    assetsProcessed++;

    while (period.getTime() <= now.getTime()) {
      const existingEntry = existingMap.get(period.getTime());
      if (existingEntry) {
        // Already generated for this month — carry the stored value forward
        // instead of recomputing, keeping repeated runs consistent.
        runningBookValue = toNumber(existingEntry.bookValueEnd);
        period = addMonthsUTC(period, 1);
        continue;
      }

      if (runningBookValue <= salvage + 0.0001) {
        // Fully depreciated already — stop generating further months.
        break;
      }

      const bookValueStart = runningBookValue;
      let amount =
        asset.depreciationMethod === "STRAIGHT_LINE"
          ? straightLineMonthly
          : bookValueStart * decliningRate;
      amount = Math.max(amount, 0);

      let bookValueEnd = bookValueStart - amount;
      let reachedSalvage = false;
      if (bookValueEnd <= salvage) {
        amount = bookValueStart - salvage;
        bookValueEnd = salvage;
        reachedSalvage = true;
      }

      await prisma.depreciationEntry.upsert({
        where: { assetId_period: { assetId: asset.id, period } },
        create: {
          assetId: asset.id,
          period,
          amount,
          bookValueStart,
          bookValueEnd,
        },
        update: {
          amount,
          bookValueStart,
          bookValueEnd,
        },
      });
      entriesCreated++;

      runningBookValue = bookValueEnd;
      if (reachedSalvage) break;
      period = addMonthsUTC(period, 1);
    }
  }

  revalidatePath("/depreciation");
  revalidatePath("/dashboard");

  return { assetsProcessed, entriesCreated };
}
