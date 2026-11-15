import gsap from 'gsap';

/** Promise-based delay on the GSAP clock (so it respects gsap.globalTimeline.timeScale for turbo mode). */
export const wait = (seconds: number) =>
  new Promise<void>((resolve) => {
    gsap.delayedCall(seconds, resolve);
  });
