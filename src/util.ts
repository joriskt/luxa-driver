const COLOR_REG: RegExp = /^#?([0-9a-f]{1,2})([0-9a-f]{1,2})([0-9a-f]{1,2})$/i;

export function clamp(input: number, minimum: number, maximum: number): number {
    return Math.min(Math.max(input, minimum), maximum);
}

export function hex2bytes(color: string): number[] {
    color = color.trim();

    const match: RegExpExecArray | null = COLOR_REG.exec(color);
    if (!match) {
        throw new Error(`Not a valid hexadecimal color: ${color}. \
        Expected a format such as '#f00' or '#00ff00'.`);
    }

    // The first element in an RegExpExecArray is always the full match. We only care about the
    // capture groups, so we shift it out of the array.
    match.shift();

    // Convert each capture group to
    const bytes: number[] = match.map((str) => {
        // Single-characters occur in hex strings such as '#fff'.
        // In this case, they should be expanded to double characters: '#ffffff'.
        if (str.length === 1) {
            str = str + str;
        }

        // Convert the hexadecimal characters (base 16, hence the argument '16') to a number.
        return Number.parseInt(str, 16);
    });

    return bytes;
}

export class DeferredPromise<T> implements Promise<T> {
    private promise: Promise<T>;

    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
        this.then = this.promise.then.bind(this.promise);
        this.catch = this.promise.catch.bind(this.promise);
        this.finally = this.promise.finally.bind(this.promise);
        this[Symbol.toStringTag] = this.promise[Symbol.toStringTag];
    }

    resolve: (value: T | PromiseLike<T>) => void = undefined as any;
    reject: (reason?: any) => void = undefined as any;

    then: Promise<T>['then'];
    catch: Promise<T>['catch'];
    finally: Promise<T>['finally'];

    [Symbol.toStringTag]: string;
}
