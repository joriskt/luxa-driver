# luxa-driver <!-- omit in toc -->

A fully-featured driver for Luxafor HID devices.

```ts
import { LuxaFlag, findOne } from 'luxa-driver';

const luxa: LuxaFlag | undefined = LuxaFlag.findOne()!;

// Protect your eyes:
await luxa.configure({ brightness: 0.1 }); 

// Solid color white:
await luxa.color('#fff');

// Fade to green slowly:
await luxa.fadeTo('#00ff00', { duration: 150 });

// Quickly blink yellow five times:
await luxa.blink('#ff0', { times: 5, duration: 50 });

// Turn the LEDs back off.
await luxa.off();
```

# Installation

Using Yarn:
```
$ yarn add luxa-driver
```

Using NPM:
```
$ npm install luxa-driver
```

# Examples

## Getting a device

```ts
const luxa: LuxaFlag | undefined = LuxaFlag.findOne();
if (!luxa) {
    console.error('Cannot find Flag. Was it inserted correctly?');
    process.exit(1);
}
```

## Configuring
```ts
// Prevent destroying your eyes! All colors are scaled by the brightness factor.
// For example '#ff0000' would effectively become '#190000'!
await luxa.configure({ brightness: 0.1 });
```

## Commands
```ts
// Set a solid color red:
await luxa.color('#ff0000');

// Fade to yellow (short hex notation):
await luxa.fade('#ff0', {
    duration: 20, // how long to take (0 is shortest, 255 is longest)
    target: FlagLEDs.FRONT, // optional: which LEDs to change
});

// Flash green:
await luxa.flash('#0f0', {
    duration: 20, // 0 - 255
    times: 5, // 0 - 255
    target: FlagLEDs.BACK_CENTER, // center LED on the back side.
});

// Apply a wave pattern with the given color and pattern (ONE through FIVE):
await luxa.wave('#0ff', FlagWave.ONE, {
    duration: 20, // 0 - 255
    times: 5, // 0 - 255
});

// Turn off the flag LEDs.
await luxa.off();
```

# Contributing
Contributions are welcome! Feel free to open a [pull request](https://github.com/joriskt/luxa-driver/pulls).

# Support
If you have problems connecting to the device, please consult [the `node-hid` support section](https://www.npmjs.com/package/node-hid#support.). I **cannot** and **will not** assist with these kinds of problems.

For functional problems or feature requests, please feel free to [open an issue](https://github.com/joriskt/luxa-driver/issues)!

# License
MIT License. See [LICENSE.md](LICENSE).