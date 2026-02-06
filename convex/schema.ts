import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    members: defineTable({
        name: v.string(),
        phone: v.string(),
        email: v.optional(v.string()),
        subscriptionAmount: v.number(),
        subscriptionType: v.string(),
        openingBalance: v.number(),
        joinDate: v.string(),
        createdAt: v.string(),
        active: v.boolean(),
    }),
    payments: defineTable({
        memberId: v.id("members"),
        amount: v.number(),
        date: v.string(),
        forMonth: v.optional(v.string()), // e.g., "January"
        forYear: v.optional(v.number()),
        mode: v.string(), // "Full Payment", "Partial Payment", "Monthly Fee", "Payment"
    }).index("by_memberId", ["memberId"]),
});
