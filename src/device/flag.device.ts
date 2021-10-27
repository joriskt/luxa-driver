import { Command, FlagLEDs, FlagWave, Response } from '../protocol';
import { HID, devices } from 'node-hid';
import { clamp, hex2bytes } from '../util';

import { LuxaDevice } from './device';

const VENDOR_ID: number = 0x04d8;
const PRODUCT_ID: number = 0xf372;

export type FadeOptions = Pick<FlagOptions, 'target' | 'duration'>;
export type FlashOptions = Pick<FlagOptions, 'target' | 'duration' | 'times'>;
export type WaveOptions = Pick<FlagOptions, 'duration' | 'times'>;

export type FlagOptions = {
    /**
     * A brightness factor to scale all colors by. Range between 0.0 and 1.0.
     *
     * @default 1.0
     */
    brightness?: number;

    /**
     * The default LEDs to target if no specific target was specified.
     *
     * @default FlagLEDs.ALL
     */
    target?: FlagLEDs;

    /**
     * The duration parameter of all non-instantaneous commands. Range between 0 and 255.
     */
    duration?: number;

    /**
     * The amount of repetitions a pattern should have.
     */
    times?: number;
};

export class LuxaFlag extends LuxaDevice {
    /*
        Configuration options
    */
    private brightness: number = 1;
    private defaultTarget: FlagLEDs = FlagLEDs.ALL;
    private defaultDuration: number = 20;
    private defaultTimes: number = 5;

    constructor(device: HID, opts?: FlagOptions) {
        super(device);
        if (opts) {
            this._configure(opts);
        }
    }

    private _configure(opts: FlagOptions): void {
        this.brightness = clamp(opts?.brightness ?? 1, 0, 1);
        this.defaultTarget = opts?.target ?? FlagLEDs.ALL;
        this.defaultDuration = clamp(opts?.duration ?? 20, 0, 255);
        this.defaultTimes = clamp(opts?.times ?? 5, 0, 255);
    }

    /**
     * Queues an update of the configuration of the device.
     *
     * **Note:** The reason this method is async is because it may otherwise affect commands that
     *           have been queued, but have not yet been executed.
     *
     * @param opts An object containing one or more options to change.
     * @returns A {@link Promise} that is resolved when this command has finished executing.
     */
    async configure(opts: FlagOptions): Promise<void> {
        return this.enqueue(async () => {
            this._configure(opts);
        });
    }

    /**
     * Sets the color on the target LEDs (default: ALL) to the specified color.
     *
     * @async
     * @param color The color.
     * @param target The LEDs to change the color of.
     * @returns A {@link Promise} that is resolved when this command has finished executing.
     */
    async color(color: string, target?: FlagLEDs): Promise<void> {
        return this.enqueue(async () => {
            this.write(Command.COLOR, target ?? this.defaultTarget, this.hex2bytes(color), 0, 0);
            return this.blockUntil(Response.ACK);
        });
    }

    /**
     * Fade to the specified color.
     *
     * @async
     * @param color The color to fade to.
     * @param opts Which LEDs to fade and how long to take.
     * @returns A {@link Promise} that is resolved when this command has finished executing.
     */
    async fade(color: string, opts?: FadeOptions): Promise<void> {
        return this.enqueue(async () => {
            this.write(
                Command.FADE,
                opts?.target ?? this.defaultTarget,
                this.hex2bytes(color),
                opts?.duration ?? this.defaultDuration,
                0
            );

            return this.blockUntil(Response.DONE);
        });
    }

    /**
     * Flashes in the specified color, and returns to the original color afterwards.
     *
     * @async
     * @param color The color to flash.
     * @param opts Which LEDs to flash, how long to blink them, and how many times.
     * @returns A {@link Promise} that is resolved when this command has finished executing.
     */
    async flash(color: string, opts?: FlashOptions): Promise<void> {
        return this.enqueue(async () => {
            this.write(
                Command.FLASH,
                opts?.target ?? this.defaultTarget,
                this.hex2bytes(color),
                opts?.duration ?? this.defaultDuration,
                0,
                opts?.times ?? this.defaultTimes
            );

            return this.blockUntil(Response.DONE);
        });
    }

    /**
     * Starts a specified wwave pattern in the given color.
     *
     * @async
     * @param color The color of the wave.
     * @param wave The wave pattern.
     * @param opts How many times to perform the pattern and how long each wave should take.
     * @returns A {@link Promise} that is resolved when this command has finished executing.
     */
    async wave(color: string, wave: FlagWave, opts?: WaveOptions): Promise<void> {
        return this.enqueue(async () => {
            this.write(
                Command.WAVE,
                wave,
                this.hex2bytes(color),
                0,
                opts?.times ?? this.defaultTimes,
                opts?.duration ?? this.defaultDuration
            );
            return this.blockUntil(Response.DONE);
        });
    }

    /**
     * Turns off all lights immediately. Equivalent of calling `color('#000')`.
     *
     * @async
     * @returns A {@link Promise} that is resolved when this command has finished executing.
     */
    async off(target?: FlagLEDs): Promise<void> {
        return this.color('#000', target);
    }

    /**
     * Convert a hexadecimal string to a byte array.
     *
     * Wrapper around {@link hex2bytes} to also apply the brightness setting.
     *
     * @param color The color string to convert.
     * @returns A three-byte array representing the Red, Green and Blue components (RGB).
     * @throws An Error when the input string is not recognized as a valid hexadecimal color string.
     */
    private hex2bytes(color: string): number[] {
        return hex2bytes(color).map((byte) => (byte *= this.brightness));
    }
}

export namespace LuxaFlag {
    export function findOne(): LuxaFlag | undefined {
        return findAll()[0];
    }

    export function findAll(): LuxaFlag[] {
        return devices(VENDOR_ID, PRODUCT_ID)
            .filter((device) => device.path !== undefined)
            .map((device) => new LuxaFlag(new HID(device.path!)));
    }
}
