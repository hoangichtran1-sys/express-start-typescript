import { eq } from "drizzle-orm";
import { z } from "zod";
import { createUploadthing, type FileRouter } from "uploadthing/express";
import { UTApi, UploadThingError } from "uploadthing/server";
import { db } from "@/configs/db";
import { storages, users } from "@/db/schema";

const f = createUploadthing();
const utapi = new UTApi();

export const uploadRouter = {
    // Define as many FileRoutes as you like, each with a unique routeSlug
    avatarUploader: f({
        image: {
            /**
             * For full list of options and defaults, see the File Route API reference
             * @see https://docs.uploadthing.com/file-routes#route-config
             */
            maxFileSize: "8MB",
            maxFileCount: 1,
        },
    })
        .input(z.object({ userId: z.string().min(1).optional() }))
        .middleware(async ({ input }) => {
            const { userId } = input;

            if (!userId) {
                throw new UploadThingError({
                    code: "FORBIDDEN",
                    message: "Unauthorized",
                });
            }

            const [user] = await db
                .select()
                .from(users)
                .where(eq(users.id, userId));

            if (!user) {
                throw new UploadThingError({
                    message: "User not found",
                    code: "NOT_FOUND",
                });
            }
            if (user.imageUrl) {
                const [existingImageInStorage] = await db
                    .select()
                    .from(storages)
                    .where(eq(storages.url, user.imageUrl));

                if (existingImageInStorage) {
                    try {
                        await utapi.deleteFiles(existingImageInStorage.key);
                    } catch {
                        throw new UploadThingError({
                            code: "BAD_REQUEST",
                            message: "Failed to delete old file",
                        });
                    }

                    await db
                        .update(storages)
                        .set({ isLinked: false })
                        .where(eq(storages.id, existingImageInStorage.id));
                }
            }

            return {
                userId: user.id,
            };
        })
        .onUploadComplete(async ({ file, metadata }) => {
            await Promise.all([
                db
                    .update(users)
                    .set({
                        imageUrl: file.ufsUrl,
                    })
                    .where(eq(users.id, metadata.userId)),
                db.insert(storages).values({
                    key: file.key,
                    url: file.ufsUrl,
                    mimeType: file.type,
                    size: file.size,
                    name: file.name,
                    isLinked: true,
                }),
            ]);

            return { uploadedBy: metadata.userId };
        }),
    attachmentUploader: f(["text", "image", "video", "audio", "pdf"])
        .input(z.object({ userId: z.string().min(1).optional() }))
        .middleware(async ({ input }) => {
            const { userId } = input;

            if (!userId) {
                throw new UploadThingError({
                    code: "FORBIDDEN",
                    message: "Unauthorized",
                });
            }

            const [user] = await db
                .select()
                .from(users)
                .where(eq(users.id, userId));

            if (!user) {
                throw new UploadThingError({
                    message: "User not found",
                    code: "NOT_FOUND",
                });
            }

            return {
                userId: user.id,
            };
        })
        .onUploadComplete(async ({ file, metadata }) => {
            await db.insert(storages).values({
                key: file.key,
                url: file.ufsUrl,
                mimeType: file.type,
                size: file.size,
                name: file.name,
                isLinked: false,
            });

            return { uploadedBy: metadata.userId };
        }),
} satisfies FileRouter;
export type OurFileRouter = typeof uploadRouter;
