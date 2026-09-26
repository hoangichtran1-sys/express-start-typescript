import { z } from "zod";
import { defineRelations } from "drizzle-orm";
import {
    pgTable,
    varchar,
    uuid,
    timestamp,
    text,
    boolean,
    integer,
    index,
    pgEnum,
} from "drizzle-orm/pg-core";
import { createSelectSchema, createUpdateSchema } from "drizzle-zod";

export const roleEnum = pgEnum("role", ["admin", "user"]);

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar({ length: 255 }),
    email: varchar({ length: 255 }).notNull().unique(),
    password: varchar({ length: 255 }),
    emailVerifiedAt: timestamp("email_verified_at"),
    imageUrl: text("image_url"),
    role: roleEnum("role").notNull().default("user"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userSelectSchema = createSelectSchema(users);
export const userUpdateSchema = createUpdateSchema(users);
export const userDTO = userSelectSchema
    .omit({
        password: true,
        createdAt: true,
        updatedAt: true,
    })
    .extend({
        id: z.string(),
        emailVerifiedAt: z.string().nullable(),
    });

export const sessions = pgTable("sessions", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    remember: boolean("remember"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verification = pgTable(
    "verification",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        identifier: uuid("identifier").notNull(),
        value: text("value").notNull().unique(),
        expiresAt: timestamp("expires_at").notNull(),

        createdAt: timestamp("created_at").$defaultFn(
            () => /* @__PURE__ */ new Date(),
        ),
        updatedAt: timestamp("updated_at").$defaultFn(
            () => /* @__PURE__ */ new Date(),
        ),
    },
    (t) => [
        index("identifier_idx").on(t.identifier),
        index("expires_at_idx").on(t.expiresAt),
    ],
);

export const storages = pgTable(
    "storages",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        key: text("key").notNull().unique(),
        url: text("url").notNull().unique(),
        name: text("name"),
        mimeType: text("mime_type"),
        size: integer("size"),
        isLinked: boolean("is_linked").$defaultFn(() => false),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (t) => [index("is_linked_idx_created_at_idx").on(t.isLinked, t.createdAt)],
);

export const posts = pgTable("posts", {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    authorId: uuid("author_id")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const attachments = pgTable("attachments", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name"),
    fileUrl: text("file_url").notNull(),
    postId: uuid("post_id")
        .references(() => posts.id, { onDelete: "cascade" })
        .notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const postSelectSchema = createSelectSchema(posts);
export const postDTO = postSelectSchema.omit({
    createdAt: true,
    updatedAt: true,
});

export const comments = pgTable("comments", {
    id: uuid("id").primaryKey().defaultRandom(),
    text: text(),
    authorId: uuid("author_id")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    postId: uuid("post_id")
        .references(() => posts.id, { onDelete: "cascade" })
        .notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const commentSelectSchema = createSelectSchema(comments);
export const commentDTO = commentSelectSchema.omit({
    createdAt: true,
    updatedAt: true,
});

export const relations = defineRelations(
    { users, sessions, posts, comments, attachments },
    (r) => ({
        users: {
            sessions: r.many.sessions(),
            posts: r.many.posts(),
            comments: r.many.comments(),
        },

        sessions: {
            user: r.one.users({
                from: r.sessions.userId,
                to: r.users.id,
            }),
        },

        posts: {
            author: r.one.users({
                from: r.posts.authorId,
                to: r.users.id,
            }),
            comments: r.many.comments(),
            attachments: r.many.attachments(),
        },

        comments: {
            author: r.one.users({
                from: r.comments.authorId,
                to: r.users.id,
            }),
            post: r.one.posts({
                from: r.comments.postId,
                to: r.posts.id,
            }),
        },

        attachments: {
            post: r.one.posts({
                from: r.attachments.postId,
                to: r.posts.id,
            }),
        },
    }),
);
