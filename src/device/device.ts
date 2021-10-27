import { Response, decodeResponse } from '../protocol';

import { DeferredPromise } from '../util';
import { HID } from 'node-hid';
import os from 'os';

type Task = {
    body: () => Promise<void>;
    promise: DeferredPromise<void>;
};

export abstract class LuxaDevice {
    protected readonly device: HID;

    private current?: Task;
    private queue: Task[];

    private unblock?: () => any;
    private unblockOn?: Response;

    constructor(device: HID) {
        this.device = device;

        // Enable non-blocking reads.
        // NOTE: The TypeScript declaration says this method wants a boolean. _It does not._
        this.device.setNonBlocking(1 as any);

        this.current = undefined;
        this.queue = [];

        // Upon receiving data from the device, we decode it and check if we were waiting for it.
        // If we were, we unblock.
        this.device.on('data', (buffer: Buffer) => {
            const response: Response = decodeResponse(buffer);
            if (this.unblock && this.unblockOn === response) {
                this.unblock();
            }
        });
    }

    /**
     * Write raw bytes to the device. All numbers/number arrays will be flattened.
     */
    protected write(...data: (number | number[])[]): void {
        // Flat map all the arrays into one long byte array, and transform each byte to make sure
        // it is always an INTEGER in the 0-255 range.
        const bytes: number[] = data.flatMap((data) => data).map((byte) => byte % 256 | 0);

        // We need to send an  leading zero byte on Windows for some reason.
        if (os.platform() === 'win32') {
            bytes.unshift(0);
        }

        this.device.write(bytes);
    }

    /**
     * Returns a promise that will not resolve until a specific Response is received.
     *
     * @async
     * @param response The response we want to see.
     * @returns A Promise that resolves when the desired {@param response} is received.
     */
    protected blockUntil(response: Response): Promise<void> {
        // Construct the deferred Promise that is to be resolved.
        const deferred: DeferredPromise<void> = new DeferredPromise();

        // Pass around the
        this.unblock = deferred.resolve;
        this.unblockOn = response;

        return deferred;
    }

    /**
     * Fetches and optionally starts the next task, if there is one.
     */
    private next(): void {
        const task: Task | undefined = this.queue.shift();

        // Since we *know* that we are going to the next task, we can unset the unblock listeners.
        this.current = task;
        this.unblock = undefined;
        this.unblockOn = undefined;

        if (!task) {
            return;
        }

        // After the task has finished, we resolve the corresponding Promise.
        task.body().then(() => task.promise.resolve());
    }

    /**
     * Creates a new {@link Task} and puts it at the back of the queue.
     *
     * @async
     * @param fn The function body of this task.
     * @returns A Promise that will resolve once the task has completed.
     */
    protected async enqueue(fn: () => Promise<void>): Promise<void> {
        // This method needs to do TWO things:
        //   1. Produce a Promise that will yield when the operation COMPLETES.
        //   2. Queue the operation WITHOUT running it.

        // Create a Promise that will not resolve until the task has completed.
        const deferred: DeferredPromise<void> = new DeferredPromise<void>();

        // Queue the task.
        this.queue.push({
            body: fn,
            promise: deferred,
        });

        // Run this task immediately if there is no active task.
        if (!this.current) {
            this.next();
        }

        // The first handler of our deferred Promise will always be our next() call.
        // This ensures that any next queued task is started, if any.
        return deferred.then(() => {
            this.next();
        });
    }

    /**
     * Clears the task queue.
     *
     * **Note:** This does NOT actually stop the current task (if any). This is unfortunately
     * not supported by the hardware.
     *
     * @async
     * @returns A {@link Promise} that is resolved as soon as the last command has finished
     *          executing.
     */
    public async clear(): Promise<void> {
        this.queue = [];
        return this.current ? this.current.promise : Promise.resolve();
    }
}
