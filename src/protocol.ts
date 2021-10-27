export enum Command {
    COLOR = 0x01,
    FADE = 0x02,
    FLASH = 0x03,
    WAVE = 0x04,
    POLICE = 0x05,
}

export enum Response {
    ACK = 0x4200,
    DONE = 0x0001,
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

export function decodeResponse(buffer: Buffer): Response {
    const raw: number = buffer.readUInt16BE() as Response;

    switch (raw) {
        case Response.ACK:
            return raw;
        case Response.DONE:
            return raw;
        default:
            throw new Error(`Unrecognized response: ${JSON.stringify(buffer)}`);
    }
}
