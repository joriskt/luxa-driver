import { HID, devices } from 'node-hid';

import os from 'os';

const VENDOR_ID: number = 0x04d8;
const PRODUCT_ID: number = 0xf372;

enum Operation {
    COLOR = 0x01,
    FADE = 0x02,
    FLASH = 0x03,
    WAVE = 0x04,
    POLICE = 0x05,
}

export enum FlagLEDs {
    ALL = 0xff,

    FRONT = 0x41,
    FRONT_BOTTOM = 0x01,
    FRONT_CENTER = 0x02,
    FRONT_TOP = 0x03,

    BACK = 0x42,
    BACK_BOTTOM = 0x04,
    BACK_CENTER = 0x05,
    BACK_TOP = 0x06,
}

export enum FlagWave {
    ONE = 0x1,
    TWO = 0x2,
    THREE = 0x3,
    FOUR = 0x4,
    FIVE = 0x5,
}

const COLOR_REG: RegExp = /^#?([0-9a-f]{1,2})([0-9a-f]{1,2})([0-9a-f]{1,2})$/i;

export type FadeOptions = {
    target?: FlagLEDs;
    duration?: number;
};

export type BlinkOptions = FadeOptions & {
    times?: number;
};

export type WaveOptions = BlinkOptions;

export function getFlag(): LuxaFlag | undefined {
    return getAllFlags()[0];
}

export function getAllFlags(): LuxaFlag[] {
    return devices(VENDOR_ID, PRODUCT_ID)
        .filter((device) => device.path !== undefined)
        .map((device) => new LuxaFlag(new HID(device.path!)));
}

export class LuxaFlag {
    private readonly device: HID;
    private brightness: number;

    constructor(device: HID) {
        this.device = device;
        this.device.pause();
        this.brightness = 1;
    }

    /**
     * Sets a brightness factor.
     *
     * @param brightness The brightness in range [0,1].
     */
    setBrightness(brightness: number): void {
        this.brightness = Math.max(0, Math.min(1, brightness));
    }

    private decode(color: string): number[] {
        color = color.trim();

        const match: RegExpExecArray | null = COLOR_REG.exec(color);
        if (!match) {
            throw new Error(`Not a valid hexadecimal color: ${color}`);
        }

        match.shift();
        const bytes: number[] = match.map((str) => {
            // Single-characters occur in hex strings such as '#fff'.
            // In this case, they should be expanded to double characters: '#ffffff'.
            if (str.length === 1) {
                str = str + str;
            }

            // Multiply by brightness to hopefully prevent your eyes from burning.
            return Math.floor(Number.parseInt(str, 16) * this.brightness);
        });

        return bytes;
    }

    private write(...data: (number | number[])[]) {
        // Flat map all the arrays into one long byte array, and transform each byte to make sure
        // it is always an INTEGER in the 0-255 range.
        const bytes: number[] = data.flatMap((data) => data).map((byte) => byte % 256 | 0);

        // Windows be quirky, yo.
        if (os.platform() === 'win32') {
            bytes.unshift(0);
        }

        this.device.resume();
        this.device.write(bytes);
        this.device.pause();
    }

    /**
     * Sets the color on the target LEDs (default: ALL) to the specified color.
     * @param color The color.
     * @param target The LEDs to change the color of.
     */
    color(color: string, target: FlagLEDs = FlagLEDs.ALL): void {
        this.write(Operation.COLOR, target, this.decode(color), 0, 0);
    }

    /**
     * Fade to the specified color.
     *
     * @param color The color to fade to.
     * @param opts Which LEDs to fade and how long to take.
     */
    fade(color: string, opts?: FadeOptions): void {
        this.write(
            Operation.FADE,
            opts?.target ?? FlagLEDs.ALL,
            this.decode(color),
            opts?.duration ?? 20,
            0
        );
    }

    /**
     * Blinks in the specified color, and returns to the original color afterwards.
     *
     * @param color The color to blink.
     * @param opts Which LEDs to blink, how long to blink them, and how many times.
     */
    blink(color: string, opts?: BlinkOptions): void {
        this.write(
            Operation.FLASH,
            opts?.target ?? FlagLEDs.ALL,
            this.decode(color),
            opts?.duration ?? 20,
            0,
            opts?.times ?? 5
        );
    }

    /**
     * Starts a specified wwave pattern in the given color.
     *
     * @param color The color of the wave.
     * @param wave The wave pattern.
     * @param opts How many times to perform the pattern and how long each wave should take.
     */
    wave(color: string, wave: FlagWave, opts?: WaveOptions): void {
        this.write(
            Operation.WAVE,
            wave,
            this.decode(color),
            0,
            opts?.times ?? 5,
            opts?.duration ?? 20
        );
    }

    /**
     * Turns off all lights immediately. Equivalent of calling `color('#000')`.
     */
    off() {
        this.color('#000');
    }
}
