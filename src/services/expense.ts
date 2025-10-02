
import { delCache, getCache, makeSummaryKey, setCache } from "../lib/cache";
import prisma from "../lib/prisma";

const SUMMARY_TTL = 60 * 10;

export async function createExpense(
    userId: string,
    payload: {
        amount: string;
        categoryId: string;
        note?: string;
        incurredAt: string;
    }
) {
    const exp = await prisma.expense.create({
        data: {
            userId,
            categoryId: payload.categoryId,
            amount: payload.amount,
            note: payload.note ?? null,
            incurredAt: new Date(payload.incurredAt),
        },
    });

    const d = new Date(exp.incurredAt);
    const key = makeSummaryKey(userId, d.getUTCFullYear(), d.getUTCMonth() + 1);
    await delCache(key);


    return {
        id: exp.id,
        userId: exp.userId,
        categoryId: exp.categoryId,
        amount: exp.amount.toString(),
        note: exp.note,
        incurredAt: exp.incurredAt.toISOString(),
    };
}


export async function updateExpense(
    expenseId: string,
    payload: {
        amount?: string;
        categoryId?: string;
        note?: string;
        incurredAt: string;
    }
) {
    const old = await prisma.expense.findUnique({ where: { id: expenseId } });
    if (!old) throw new Error("Expense not found!");

    const updated = await prisma.expense.update({
        where: { id: expenseId },
        data: {
            amount: payload.amount ?? undefined,
            categoryId: payload.categoryId ?? undefined,
            note: payload.note ?? undefined,
            incurredAt: payload.incurredAt
                ? new Date(payload.incurredAt)
                : undefined,
        },
    });

    const oldKey = makeSummaryKey(
        old.userId,
        old.incurredAt.getUTCFullYear(),
        old.incurredAt.getUTCMonth() + 1
    );
    await delCache(oldKey);

    const newKey = makeSummaryKey(
        updated.userId,
        updated.incurredAt.getUTCFullYear(),
        updated.incurredAt.getUTCMonth() + 1
    );
    if (newKey !== oldKey) await delCache(newKey);


    return {
        id: updated.id,
        userId: updated.userId,
        categoryId: updated.categoryId,
        amount: updated.amount.toString(),
        note: updated.note,
        incurredAt: updated.incurredAt.toISOString(),
    };
}


export async function deleteExpense(expenseId: string) {
    const old = await prisma.expense.findUnique({ where: { id: expenseId } });
    if (!old) throw new Error("Expense not found!");

    await prisma.expense.delete({ where: { id: expenseId } });

    const oldKey = makeSummaryKey(
        old.userId,
        old.incurredAt.getUTCFullYear(),
        old.incurredAt.getUTCMonth() + 1
    );
    await delCache(oldKey);

    return { ok: true };
}

export async function monthlySummary(
    userId: string,
    year: number,
    month: number
) {
    const key = makeSummaryKey(userId, year, month);

    const cached = await getCache(key);
    if (cached) return JSON.parse(cached);

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const rows = await prisma.$queryRaw<
        { categoryId: string; categoryName: string; total: string }[]
    >`
    SELECT c.id as "categoryId", c.name as "categoryName", SUM(e.amount)::text as total
    FROM "Expense" e
    JOIN "Category" c ON e."categoryId" = c.id
    WHERE e."userId" = ${userId}
      AND e."incurredAt" >= ${start}
      AND e."incurredAt" < ${end}
    GROUP BY c.id, c.name
    ORDER BY SUM(e.amount) DESC;
  `;

    const result = (rows as { categoryId: string; categoryName: string; total: string }[])
        .map((r) => ({
            categoryId: r.categoryId,
            categoryName: r.categoryName,
            total: r.total,
        }));

    await setCache(key, JSON.stringify(result), SUMMARY_TTL);

    return result;
}