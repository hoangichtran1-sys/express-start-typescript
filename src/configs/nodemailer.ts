import nodemailer, { type Transporter } from "nodemailer";
import { env } from "./env";

let transporter: Transporter | null = null;

export function getTransporter() {
    if (transporter) return transporter;
    const host = env.SMTP_HOST;
    const port = env.SMTP_PORT;
    const user = env.SMTP_USER;
    const pass = env.SMTP_PASS;

    transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
    });
    return transporter;
}
