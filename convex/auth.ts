import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import bcrypt from "bcryptjs";

export const isAdminInitialized = query({
    args: {},
    handler: async (ctx) => {
        const admins = await ctx.db.query("admins").collect();
        return admins.length > 0;
    },
});

export const initAdmin = mutation({
    args: { password: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("admins").collect();
        if (existing.length > 0) return { success: false, message: "Admin already initialized" };

        const salt = bcrypt.genSaltSync(10);
        const passwordHash = bcrypt.hashSync(args.password, salt);

        await ctx.db.insert("admins", { passwordHash });
        return { success: true };
    },
});

export const verify = mutation({
    args: { password: v.string() },
    handler: async (ctx, args) => {
        const admins = await ctx.db.query("admins").collect();
        if (admins.length === 0) return { success: false, message: "No admin found" };

        const admin = admins[0];
        const isValid = bcrypt.compareSync(args.password, admin.passwordHash);
        return { success: isValid };
    },
});

export const updatePassword = mutation({
    args: {
        currentPassword: v.string(),
        newPassword: v.string()
    },
    handler: async (ctx, args) => {
        const admins = await ctx.db.query("admins").collect();
        if (admins.length === 0) return { success: false, message: "Admin not found" };

        const admin = admins[0];
        const isValid = bcrypt.compareSync(args.currentPassword, admin.passwordHash);
        if (!isValid) return { success: false, message: "Incorrect current password" };

        const salt = bcrypt.genSaltSync(10);
        const passwordHash = bcrypt.hashSync(args.newPassword, salt);

        await ctx.db.patch(admin._id, { passwordHash });
        return { success: true };
    },
});
