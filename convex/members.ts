import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const add = mutation({
    args: {
        name: v.string(),
        phone: v.string(),
        email: v.optional(v.string()),
        subscriptionAmount: v.number(),
        subscriptionType: v.string(),
        balance: v.number(), // This is the opening dues from the form
        joinDate: v.string(),
    },
    handler: async (ctx, args) => {
        const memberId = await ctx.db.insert("members", {
            name: args.name,
            phone: args.phone,
            email: args.email,
            subscriptionAmount: args.subscriptionAmount,
            subscriptionType: args.subscriptionType,
            openingBalance: args.balance,
            joinDate: args.joinDate,
            createdAt: new Date().toISOString(),
            active: true,
        });
        return memberId;
    },
});

export const list = query({
    handler: async (ctx) => {
        return await ctx.db.query("members").collect();
    },
});

export const get = query({
    args: { id: v.id("members") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const update = mutation({
    args: {
        id: v.id("members"),
        name: v.string(),
        phone: v.string(),
        email: v.optional(v.string()),
        subscriptionAmount: v.number(),
        subscriptionType: v.string(),
        joinDate: v.string(),
        active: v.boolean(),
    },
    handler: async (ctx, args) => {
        const { id, ...fields } = args;
        await ctx.db.patch(id, fields);
    },
});

export const remove = mutation({
    args: { id: v.id("members") },
    handler: async (ctx, args) => {
        // Also delete associated payments
        const payments = await ctx.db
            .query("payments")
            .withIndex("by_memberId", (q) => q.eq("memberId", args.id))
            .collect();

        for (const payment of payments) {
            await ctx.db.delete(payment._id);
        }

        await ctx.db.delete(args.id);
    },
});
