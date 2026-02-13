export async function hashPassword(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(salt)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
    );

    const derived = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256",
        },
        key,
        256
    );

    const hashHex = Array.from(new Uint8Array(derived))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const [saltHex, hashHex] = storedHash.split(":");
    const salt = Uint8Array.from(saltHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)));

    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
    );

    const derived = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256",
        },
        key,
        256
    );

    const computedHashHex = Array.from(new Uint8Array(derived))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    return hashHex === computedHashHex;
}
