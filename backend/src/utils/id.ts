import { nanoid } from "nanoid";

export function generateId(): string {
    return nanoid(21);
}

export function now(): string {
    return new Date().toISOString();
}
