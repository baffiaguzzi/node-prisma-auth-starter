import { prisma } from "../config/db.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateToken } from "../utils/generateToken.js";
import { generatePasswordResetToken } from "../utils/generateReset.js";
import { sendWelcomeEmail, sendPasswordResetEmail, sendAdminEventEmail, sendLoginAlertEmail } from "../utils/emailService.js";

const register = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await prisma.user.findUnique({
            where: { email: email }
        });
        if (userExists) {
            return res
                .status(400)
                .json({ error: "User already exists with this email!" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword
            }
        });

        sendWelcomeEmail(user.email, user.name).catch(err =>
            console.error("Welcome email error:", err.message)
        );

        sendAdminEventEmail("New user registered", {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
        }).catch(err => console.error("Admin register email error:", err.message));

        const token = generateToken(user.id, res);
        res.status(201).json({
            status: "success",
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                },
                token
            }
        });
    } catch (error) {
        console.error("Register error:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

const login = async (req, res) => {
    const {email, password} = req.body;

    const user = await prisma.user.findUnique({
        where: {email: email}
    })
    if (!user) {
        return res
            .status(401)
            .json({ error: "Invalid email or password!"})
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res
            .status(401)
            .json({ error: "Invalid password!"})
    }

    const token = generateToken(user.id, res);

    const eventDetails = {
        userId: user.id,
        email: user.email,
        time: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.headers["user-agent"],
    };

    sendLoginAlertEmail(user.email, eventDetails).catch(err =>
        console.error("Login alert email error:", err.message)
    );

    sendAdminEventEmail("User login", eventDetails).catch(err =>
        console.error("Admin login email error:", err.message)
    );

    res.status(201).json({
        status: "success",
        data: {
            user: {
                id: user.id,
                email: user.email
            },
            token
        }
    });
}

const logout = async (req, res) => {
    res.cookie("jwt", "", {
        httpOnly: true,
        expires: new Date(0)
    });
    res 
        .status(200)
        .json({
            status: "success",
            message: "Logged out successfully!"
        });
}

const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            sendAdminEventEmail("Password reset requested for unknown email", {
                email,
                time: new Date().toISOString(),
                ip: req.ip,
            }).catch(() => {});
            return res.status(200).json({
                status: "success",
                message: "If an account with that email exists, a reset link has been sent.",
            });
        }

        const { resetToken, hashedToken, expires } = generatePasswordResetToken();

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: hashedToken,
                resetTokenExpires: expires,
            },
        });

        const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

        sendPasswordResetEmail(user.email, resetUrl).catch(err =>
            console.error("Reset email error:", err.message)
        );

        sendAdminEventEmail("Password reset requested", {
            userId: user.id,
            email: user.email,
            time: new Date().toISOString(),
            ip: req.ip,
        }).catch(err =>
            console.error("Admin reset request email error:", err.message)
        );

        return res.status(200).json({
            status: "success",
            message: "If an account with that email exists, a reset link has been sent.",
            debug: process.env.NODE_ENV === "development" ? { resetToken, resetUrl } : undefined
        });
    } catch (error) {
        console.error("Forgot password error:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const resetPassword = async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ error: "Token and new password are required" });
    }

    try {
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await prisma.user.findFirst({
            where: {
                resetToken: hashedToken,
                resetTokenExpires: {
                    gt: new Date(),
                },
            },
        });

        if (!user) {
            return res.status(400).json({
                error: "Invalid or expired password reset token.",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpires: null,
            },
        });

        return res.status(200).json({
            status: "success",
            message: "Password has been reset successfully. You can now log in.",
        });
    } catch (error) {
        console.error("Reset password error:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export { register, login, logout, forgotPassword, resetPassword };
