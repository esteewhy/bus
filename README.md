# Build your own bus...

Or [use](//bit.ly/busfactory) one of these for inspiration:

![Pre-built fleet](https://github.com/esteewhy/bus/blob/main/demo.png?raw=true)

# Trivia

UX is built almost entirely with CSS 4. Relies on infamous :has selector, so as of yet (2023/06) won't run in Firefox. JavaScript is only used for generating playground, insertion, saving, and so on.

# How to...

Click anywhere on the bus to open pallette of available parts. Limited logic applies, e. g.: start with the tail, finish with front panel, wheel or hatch can only appear beneath a window, and so on.

Click outside of any vehicle to close modal dialogs.

While pallette is open notice a tooltip message with part's "code". A serie of such "codes" represent a vehicle for storage or sharing.

To add a new vehicle use **add** url parameter like this:
https://esteewhy.github.io/bus/?add=t0d7w2a0w2l1d7w2l3w2a3d4h0f0h0w3l2w2a3w2l2w2w2w2a0w2l2t0r0c1.

To share a vehicle use "toast" menu where you can find link like this one:
https://esteewhy.github.io/bus/?bus1686060992512=t0d5w2a3w0blank0d5j0w2a0w2l1d5w0l3w2a3d5h0c8. Don't click, but copy it and share. The URL parameter, as you can imagine, is a unique vehicle **id** based on timestamp. Anywone with such link will get the same vehicle added to their "fleet".

Initial 7 vehicles are a kind of "genesis" block. They're unremovable, but mutable. (These correspond to my physical bus collection, by the way).

# What the future holds?

Design opposite side maybe?

![Full projection](https://github.com/esteewhy/bus/blob/main/demo-projection.png?raw=true)

Or maybe even 3D rendering?

![Full projection](https://github.com/esteewhy/bus/blob/main/demo-3d.png?raw=true)

Dedicated to László Finta (1934—2018), a hungarian automotive designer responsible for ingenious design of Ikarus 200 series buses and coaches.
