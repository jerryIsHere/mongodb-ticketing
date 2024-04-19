import crypto from "crypto";
export const generateResetToken = async () => {
    const tokenLength = 32;
    const token = crypto.randomBytes(tokenLength).toString("hex");
    return token;
};
