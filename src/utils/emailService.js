import nodemailer from "nodemailer";

const NODE_ENV = process.env.NODE_ENV || "development";
const isTest = NODE_ENV === "test";
const isDev = NODE_ENV === "development";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    pool: true,        
    maxConnections: 1,   
    maxMessages: 5,  
    rateDelta: 1000,    
    rateLimit: true,   
    logger: true,    
    debug: true
});

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export const sendWelcomeEmail = async (toEmail, name) => {
    if (isTest) {
        console.log("[MOCK WELCOME EMAIL]", { toEmail, name });
        return { mock: true, toEmail, name };
    }

    await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: toEmail,
        subject: "Welcome to NodePrismaAS",
        html: `
            <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 16px; color: #0f172a;">
                <h2 style="margin-bottom: 8px;">Welcome to NodePrismaAS 🎬</h2>
                <p style="margin: 0 0 12px;">Hi ${name || ""},</p>
                <p style="margin: 0 0 12px;">
                    Your account has been created successfully. You can now log in and start managing your watchlist.
                </p>
                <p style="margin: 0 0 16px;">
                    Log in anytime at: <a href="${FRONTEND_URL || "http://localhost:3000"}/login">
                    ${FRONTEND_URL || "http://localhost:3000"}/login
                    </a>
                </p>
                <p style="margin: 0 0 0;font-size:12px;color:#64748b;">
                    If you did not create this account, please contact support or ignore this email.
                </p>
            </div>
        `,
    });
};

export const sendPasswordResetEmail = async (toEmail, resetUrl) => {
    if (isTest) {
        console.log("[MOCK RESET EMAIL]", toEmail, resetUrl);
        return { mock: true, toEmail, resetUrl };
    }

    const mailOptions = {
        from: process.env.MAIL_FROM,
        to: toEmail,
        subject: "Reset your NodePrismaAS password",
        html: `
            <p>Hello,</p>
            <p>You requested a password reset for your NodePrismaAS account.</p>
            <p>Click the link below to choose a new password:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>If you did not request this, you can safely ignore this email.</p>
            <p>This link will expire in 1 hour.</p>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Mailtrap sendMail info:", info);
    } catch (err) {
        console.error("Mailtrap sendMail error:", err);
        throw err;
    }
};

export const sendLoginAlertEmail = async (toEmail, details) => {
    if (isTest) {
        console.log("[MOCK LOGIN ALERT EMAIL]", { toEmail, details });
        return { mock: true, toEmail, details };
    }

    await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: toEmail,
        subject: "New login to your NodePrismaAS account",
        html: `
            <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 16px; color: #0f172a;">
                <h2 style="margin-bottom: 8px;">New login detected</h2>
                <p style="margin: 0 0 12px;">Hi,</p>
                <p style="margin: 0 0 12px;">
                    Your account was just used to log in.
                </p>
                <p style="margin: 0 0 12px;font-size:12px;color:#64748b;">
                    Time: ${details.time}<br/>
                    IP: ${details.ip || "unknown"}<br/>
                    User agent: ${details.userAgent || "unknown"}
                </p>
                <p style="margin: 0 0 0;font-size:12px;color:#64748b;">
                    If this wasn’t you, please reset your password immediately.
                </p>
            </div>
        `,
    });
};

export const sendAdminEventEmail = async (eventType, payload) => {
    if (!ADMIN_EMAIL) return;

    if (isDev || isTest) {
        console.log("[MOCK ADMIN EMAIL]", eventType, payload);
        return { mock: true, eventType, payload };
    }

    await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: ADMIN_EMAIL,
        subject: `[NodePrismaAS] ${eventType}`,
        html: `
            <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 16px; color: #0f172a;">
                <h2 style="margin-bottom: 8px;">${eventType}</h2>
                <pre style="font-size:12px;background:#020617;color:#e2e8f0;padding:12px;border-radius:8px;white-space:pre-wrap;word-break:break-word;">
                    ${JSON.stringify(payload, null, 2)}
                </pre>
            </div>
        `,
    });
};
