import cron from "node-cron";
import { cleanupStorageFiles } from "@/cron/jobs/cleanup-storage.job";
import { cleanupVerificationToken } from "@/cron/jobs/cleanup-verification.job";

const scheduleJob = (name: string, time: string, job: () => Promise<void>) => {
    console.log(`Scheduling ${name} at ${time}`);

    return cron.schedule(
        time,
        async () => {
            try {
                await job();
                console.log(`${name} completed`);
            } catch (error) {
                console.log(`${name} failed`, error);
            }
        },
        {
            timezone: "Asia/Ho_Chi_Minh",
        },
    );
};

export const startJobs = () => {
    return [
        scheduleJob("Cleanup storage files", "0 1 * * *", cleanupStorageFiles),

        scheduleJob(
            "Cleanup verification tokens",
            "0 2 * * *",
            cleanupVerificationToken,
        ),
    ];
};
