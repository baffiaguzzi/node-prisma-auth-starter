import crypto from "crypto";

export const generatePasswordResetToken = () => {
    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    const expires = new Date(Date.now() + 1000 * 60 * 60);

    return { resetToken, hashedToken, expires };
};
