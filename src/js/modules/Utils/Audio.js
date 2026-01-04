export class Audio {
    constructor() {
        this.ambientAudio = null;
    }

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

        }
    }
}
