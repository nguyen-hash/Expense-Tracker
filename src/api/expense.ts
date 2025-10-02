import { api } from "encore.dev/api";
import * as expenseService from "../services/expense";


export const createExpense = api(
    { method: 'POST', path: '/expenses' },
    async(req: {
        userId: string;
        amount: string;
        categoryId: string;
        note?: string;
        incurredAt: string;
    }) => {
        return await expenseService.createExpense(req.userId, req);
    }
);

export const updateExpense = api(
    { method: 'PUT', path: '/expenses/:id' },
    async(req: {
        id: string;
        amount?: string;
        categoryId?: string;
        note?: string;
        incurredAt: string;
    }) => {
        return await expenseService.updateExpense(req.id, req);
    }
)

export const deleteExpense = api(
    { method: 'DELETE', path: '/expenses/:id'},
    async(req: { id: string }) => { 
        return await expenseService.deleteExpense(req.id) ;
    }
)

export const monthlySummary = api(
    { method: 'GET', path: '/expenses/summary/:year/:month' },
    async(req: { userId: string; year: number; month: number }) => {
        return await expenseService.monthlySummary(req.userId, req.year, req.month);
    }
)
