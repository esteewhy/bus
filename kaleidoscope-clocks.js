/**
 * Kaleidoscope Clocks
 *
 * Created in collaboration with Microsoft Copilot and a certain machine-loving developer,
 * this script turns a CSS gradient example from
 * [https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_images/Using_CSS_gradients#multiple_repeating_linear_gradients]
 * into a dynamic "kaleidoscope clock." It randomizes gradient values to simulate time
 * with artistic flair and playful functionality.
 *
 * Fun fact: This whimsical background clock shows time through gradient angles—
 * hours on one dial and minutes on another—while subtly shifting colors and stops.
 *
 *   * * *
 * [Chorus]
 * Lost in kaleidoscope skies, mesmerized,
 * Watch the gradient dance in time, synchronised.
 */
document.addEventListener('DOMContentLoaded', () => {
    const body = document.body; // Apply background to the HTML body

    // Helper function to randomize a value by ±10%
    const randomizeValue = (value, range = 0.1) => {
        const delta = value * range; // Calculate ±10% variation
        return Math.floor(value + (Math.random() * 2 - 1) * delta); // Randomize within range
    };

    // Original gradient values
    const originalGradient = {
        pxValues1: [40, 80, 120, 160, 200, 240, 280, 300],
        pxValues2: [30, 60, 90, 120, 150, 180, 210, 230],
        colors: [
            [255, 0, 0],        // Red
            [255, 153, 0],      // Orange
            [255, 255, 0],      // Yellow
            [0, 255, 0],        // Green
            [0, 0, 255],        // Blue
            [75, 0, 130],       // Indigo
            [238, 130, 238],    // Violet
            [255, 0, 0]         // Red
        ]
    };

    // Randomize px values and colors by ±10%
    const randomizedPxValues1 = originalGradient.pxValues1.map(px => randomizeValue(px, 0.15));
    const randomizedPxValues2 = originalGradient.pxValues2.map(px => randomizeValue(px, 0.1));
    const randomizedColors1 = originalGradient.colors.map(rgb => rgb.map(clr => randomizeValue(clr, 0.2)));
    const randomizedColors2 = originalGradient.colors.map(rgb => rgb.map(clr => randomizeValue(clr, 0.1)));

    // Function to update the clock-like dials
    const updateDials = () => {
        const now = new Date();
        const hours = now.getHours() % 12; // 12-hour format
        const minutes = now.getMinutes();

        // Calculate degrees for gradients
        const hoursDeg = (hours * 30) + (minutes / 60) * 30 - 90; // Hours with fractional sweep
        const minutesDeg = (minutes * 6) - 90; // Minutes position

        // Generate gradients with corrected degrees and randomized values
        const hoursGradient = `repeating-linear-gradient(
            ${hoursDeg}deg,
            ${randomizedColors1.map((clr, n) => `rgba(${clr.join()}, 0.5) ${randomizedPxValues1[n]}px`).join(', ')}
        )`;

        const minutesGradient = `repeating-linear-gradient(
            ${minutesDeg}deg,
            ${randomizedColors2.map((clr, n) => `rgba(${clr.join()}, 0.5) ${randomizedPxValues2[n]}px`).join(', ')}
        )`;

        body.style.background = `${hoursGradient}, ${minutesGradient}`;
    };

    // Initial rendering
    updateDials();

    // Periodic updates (every minute)
    setInterval(updateDials, 60 * 1000);
});
