import { eq, lt } from "drizzle-orm";
import { db } from "@/configs/db";
import { verification } from "@/db/schema";
import { logger } from "@/server";

export const cleanupVerificationToken = async () => {
    try {
        console.log("🧹 Starting verification db cleanup...");

        const now = new Date();

        const results = await db
            .select()
            .from(verification)
            .where(lt(verification.expiresAt, now));
        if (results.length > 0) {
            await Promise.all(
                results.map((item) =>
                    db.delete(verification).where(eq(verification.id, item.id)),
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
