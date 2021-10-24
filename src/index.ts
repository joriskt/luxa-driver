import { FlagLEDs, LuxaFlag, getFlag } from './flag';

export * from './flag';

const flag: LuxaFlag | undefined = getFlag();
if (!flag) {
    process.exit(0);
}

flag.setBrightness(0.1);
flag.off();
flag.color('#0f0', FlagLEDs.FRONT);
