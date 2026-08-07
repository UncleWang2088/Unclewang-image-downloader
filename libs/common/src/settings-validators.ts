import type { JsonValue } from "type-fest";

export function bool(def: boolean) {
    return (stored: unknown): boolean =>
        typeof stored === "boolean" ? stored : def;
}

export function str(def: string, ...validators: ((i: string) => boolean)[]) {
    return (stored: unknown): string =>
        typeof stored === "string" && validators.every((val) => val(stored))
            ? stored
            : def;
}

export function matching(regex: RegExp) {
    return (input: string): boolean => regex.test(input);
}

export function notBlank(value: string): boolean {
    return value.trim().length > 0;
}

export function num(def: number, ...validators: ((i: number) => boolean)[]) {
    return (input: unknown): number =>
        typeof input === "number" && validators.every((val) => val(input))
            ? input
            : def;
}

export function stringEnum<T extends string>(
    enumType: Record<string, T>,
    def: T
) {
    return (input: unknown): T => {
        const isValid =
            typeof input === "string" &&
            Object.values(enumType)
                .map((entry) => entry as string)
                .includes(input);
        return isValid ? (input as T) : def;
    };
}

export function stringArray(
    def: string[],
    ...validators: ((x: string) => boolean)[]
) {
    return (input: unknown): string[] =>
        Array.isArray(input) &&
        input.every(
            (entry) =>
                typeof entry === "string" &&
                validators.every((validator) => validator(entry))
        )
            ? (input as string[])
            : def;
}

export function roundedTo(decimals: number) {
    return (input: number): boolean => {
        const multiplied = input * 10 ** decimals;
        return multiplied === Math.round(multiplied);
    };
}

export function gt(min: number) {
    return (input: number): boolean => input > min;
}

export function gte(min: number) {
    return (input: number): boolean => input >= min;
}

export function lte(max: number) {
    return (input: number): boolean => input <= max;
}

export function sanitize<T, K extends keyof T = keyof T>(
    source: Record<K, JsonValue>,
    spec: Record<K, (x: unknown) => T[K]>
): T {
    const destination: Partial<T> = {};

    for (const field of Object.getOwnPropertyNames(spec) as K[]) {
        if (field in spec) {
            const validator = spec[field];
            const sourceValue = source[field];

            destination[field] = validator(sourceValue);
        }
    }

    return destination as T;
}

export type SettingsOf<T extends Record<string, (val: unknown) => unknown>> = {
    readonly [P in keyof T]: ReturnType<T[P]>;
};
