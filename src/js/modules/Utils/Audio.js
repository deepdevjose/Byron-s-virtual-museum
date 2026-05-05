/**
 * Manages ambient museum audio.
 *
 * Browsers usually require a user gesture before audio playback, so setup
 * waits for the first click before attempting to play the looping ambient track.
 */
export class Audio {
    /**
     * Initializes audio element references.
     */
    constructor() {
        this.ambientAudio = null;
    }

    /**
     * Connects the static ambient audio element and prepares first-click playback.
     */
    setup() {
        this.ambientAudio = document.getElementById('ambient-audio');

        if (this.ambientAudio) {
            this.ambientAudio.volume = 0.3;
            this.ambientAudio.loop = true;

            const playAudio = () => {
                this.ambientAudio.play().catch(() => {

                });
            };

            document.addEventListener('click', playAudio, { once: true });
        } else {
            // Continue silently when the static audio element is not present.
        }
    }

    /**
     * Pauses ambient audio while artwork-specific media is active.
     */
    pauseAmbient() {
        if (this.ambientAudio && !this.ambientAudio.paused) {
            this.ambientAudio.pause();
        }
    }

    /**
     * Resumes ambient audio after modal or panel media closes.
     */
    resumeAmbient() {
        if (this.ambientAudio && this.ambientAudio.paused) {
            this.ambientAudio.play().catch(() => {});
        }
    }
}
