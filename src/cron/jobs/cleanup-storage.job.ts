import { eq, and, lt } from "drizzle-orm";
import { subDays } from "date-fns";
import { db } from "@/configs/db";
import { storages } from "@/db/schema";
import { logger } from "@/server";

export const cleanupStorageFiles = async () => {
    try {
        console.log("🧹 Starting storage db cleanup...");

        const oneDayAgo = subDays(new Date(), 1);

        const results = await db
            .select()
            .from(storages)
            .where(
                and(
                    eq(storages.isLinked, false),
                    lt(storages.createdAt, oneDayAgo),
                ),
            );
        if (results.length > 0) {
            await Promise.all(
                results.map((item) =>
                    db.delete(storages).where(eq(storages.id, item.id)),
                ),
            );
        }

        console.log(`✅ Cleanup finished. Removed ${results.length} records.`);
        logger.info(`✅ Cleanup finished. Removed ${results.length} records.`);
    } catch (error) {
        console.error("❌ Cleanup job failed:", error);
        logger.error(error, "❌ Cleanup job failed");
    }
};
