import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
    args: { memberId: v.optional(v.id("members")) },
    handler: async (ctx, args) => {
        if (args.memberId) {
            return await ctx.db
                .query("payments")
                .withIndex("by_memberId", (q) => q.eq("memberId", args.memberId))
                .collect();
        }
        return await ctx.db.query("payments").collect();
    },
});

export const add = mutation({
    args: {
        memberId: v.id("members"),
        amount: v.number(),
        date: v.optional(v.string()),
        forMonth: v.optional(v.string()),
        forYear: v.optional(v.number()),
        mode: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("payments", {
            ...args,
            date: args.date ?? new Date().toISOString(),
        });
    },
});

export const remove = mutation({
    args: { id: v.id("payments") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const toggleMonth = mutation({
    args: {
        memberId: v.id("members"),
        month: v.string(),
        year: v.number(),
        amount: v.number(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("payments")
            .withIndex("by_memberId", (q) => q.eq("memberId", args.memberId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("forMonth"), args.month),
                    q.eq(q.field("forYear"), args.year)
                )
            )
            .unique();

        if (existing) {
            await ctx.db.delete(existing._id);
        } else {
            await ctx.db.insert("payments", {
                memberId: args.memberId,
                amount: args.amount,
                date: new Date().toISOString(),
                forMonth: args.month,
                forYear: args.year,
                mode: "Full Payment",
            });
        }
    },
});
