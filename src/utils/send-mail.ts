import { env } from "@/configs/env";
import { getTransporter } from "@/configs/nodemailer";
import { ApiError } from "./api-error";

type SendMail = {
    from?: string;
    subject: string;
    data?: Record<string, any>;
    email: string;
    html: string;
};

export async function sendEmail({ from, email, subject, html }: SendMail) {
    const transporter = getTransporter();

    return transporter
        .sendMail({
            from: from || `<${env.EMAIL_FROM}>`,
            to: email,
            subject,
            html,
        })
        .catch(() => {
            throw ApiError.badRequest("Failed to send email");
        });
}
