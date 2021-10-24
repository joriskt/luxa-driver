# luxa-driver

A simple driver for the Luxafor Flag.

# Usage

```ts
import { FlagLEDs, FlagWave, LuxaFlag } from 'luxa-driver';

// Grab the first Flag we can find, if any:
const luxa: LuxaFlag | undefined = LuxaFlag.findOne();
if (!luxa) {
    console.error('Cannot find Flag. Was it inserted correctly?');
    process.exit(1);
}

// Prevent destroying our eyes! All colors are scaled by this factor.
// For example '#ff0000' would effectively become '#190000'!
luxa.setBrightness(0.1);

// Set a solid color red:
luxa.color('#ff0000');

// Fade to yellow (short hex notation):
luxa.fade('#ff0', {
    duration: 20, // how long to take (0 is shortest, 255 is longest)
    target: FlagLEDs.FRONT, // optional: which LEDs to change
});

// Flash green:
luxa.flash('#0f0', {
    duration: 20, // 0 - 255
    times: 5, // 0 - 255
    target: FlagLEDs.BACK_CENTER, // center LED on the back side.
});

// Apply a wave pattern with the given color and pattern (ONE through FIVE):
luxa.wave('#0ff', FlagWave.ONE, {
    duration: 20, // 0 - 255
    times: 5, // 0 - 255
});

// Turn off the flag.
luxa.off();
```