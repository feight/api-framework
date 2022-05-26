import { error } from "@lib/errors";
import { createHash, randomUUID } from "crypto";

/**
 * Generates a SHA512 hash from a UUID. This string can be used
 * as a token for authentication, etc.
 */
export function getSecureString(): string {
    return createHash("sha512").update(randomUUID()).digest("hex");
}

export function hashPassword(pwd: string, salt?: string): string {
    const value = (salt ?? "!=&moo**.@") + pwd;
    return createHash("sha1").update(value).digest("hex");
}

export function getTempPassword(email: string): string {
    const value = "!=$poo**.@" + email;
    return createHash("sha1").update(value).digest("hex");
}

export function verifyPassword(pwd: string): void {
    //@
    if (pwd.length < 8) {
        throw new error.PasswordTooShort();
    }
    if (pwd.toUpperCase() === pwd) {
        throw new error.PasswordNeedsLowerChar();
    }
    if (!pwd.match(".*\\d.*")) {
        throw new error.PasswordNeedsDigit();
    }
}
