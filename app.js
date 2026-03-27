// BakeryBeats MVP - Simple Beat Sequencer

class BakeryBeats {
    constructor() {
        this.tempo = 120;
        this.isPlaying = false;
        this.currentStep = 0;
        this.numSteps = 16;
        this.intervalId = null;

        // Instruments with their sounds (using Web Audio API)
        this.instruments = [
            { name: 'mixer', emoji: '🥣', frequency: 200, type: 'sine' },
            { name: 'cutter', emoji: '🍪', frequency: 400, type: 'square' },
            { name: 'oven', emoji: '🔥', frequency: 300, type: 'sawtooth' },
            { name: 'register', emoji: '🛒', frequency: 500, type: 'triangle' },
            { name: 'bell', emoji: '🔔', frequency: 800, type: 'sine' }
        ];

        // 5 rows (instruments) x 16 columns (steps)
        this.pattern = Array(this.instruments.length)
            .fill(null)
            .map(() => Array(this.numSteps).fill(false));

        this.audioContext = null;
        this.init();
    }

    init() {
        this.setupUI();
        this.setupEventListeners();
        this.renderSequencer();
    }

    setupUI() {
        this.playBtn = document.getElementById('playBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.tempoSlider = document.getElementById('tempo');
        this.tempoValue = document.getElementById('tempoValue');
        this.stepsGrid = document.getElementById('stepsGrid');
    }

    setupEventListeners() {
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.clearBtn.addEventListener('click', () => this.clearPattern());

        this.tempoSlider.addEventListener('input', (e) => {
            this.tempo = parseInt(e.target.value);
            this.tempoValue.textContent = this.tempo;
            if (this.isPlaying) {
                this.stop();
                this.play();
            }
        });

        // Sound preview buttons
        document.querySelectorAll('.sound-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const soundName = btn.dataset.sound;
                this.playSound(soundName);
            });
        });
    }

    renderSequencer() {
        this.stepsGrid.innerHTML = '';

        for (let row = 0; row < this.instruments.length; row++) {
            for (let col = 0; col < this.numSteps; col++) {
                const step = document.createElement('div');
                step.className = 'step';
                step.dataset.row = row;
                step.dataset.col = col;

                if (this.pattern[row][col]) {
                    step.classList.add('active');
                }

                step.addEventListener('click', () => this.toggleStep(row, col));
                this.stepsGrid.appendChild(step);
            }
        }
    }

    toggleStep(row, col) {
        this.pattern[row][col] = !this.pattern[row][col];
        this.updateStepDisplay(row, col);
    }

    updateStepDisplay(row, col) {
        const step = this.stepsGrid.querySelector(
            `[data-row="${row}"][data-col="${col}"]`
        );
        step.classList.toggle('active', this.pattern[row][col]);
    }

    togglePlay() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.play();
        }
    }

    play() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        this.isPlaying = true;
        this.playBtn.textContent = '⏸️ Pause';
        this.currentStep = 0;

        const stepDuration = 60000 / (this.tempo * 4); // 16th notes

        this.intervalId = setInterval(() => {
            this.playStep();
            this.currentStep = (this.currentStep + 1) % this.numSteps;
        }, stepDuration);
    }

    stop() {
        this.isPlaying = false;
        this.playBtn.textContent = '▶️ Play';
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.currentStep = 0;
        this.clearCurrentStepHighlight();
    }

    clearPattern() {
        this.pattern = this.pattern.map(row => row.map(() => false));
        this.renderSequencer();
    }

    playStep() {
        this.clearCurrentStepHighlight();

        for (let row = 0; row < this.instruments.length; row++) {
            if (this.pattern[row][this.currentStep]) {
                this.playSound(this.instruments[row].name);
            }
        }

        this.highlightCurrentStep();
    }

    highlightCurrentStep() {
        for (let row = 0; row < this.instruments.length; row++) {
            const step = this.stepsGrid.querySelector(
                `[data-row="${row}"][data-col="${this.currentStep}"]`
            );
            step.classList.add('current');
        }
    }

    clearCurrentStepHighlight() {
        document.querySelectorAll('.step.current').forEach(step => {
            step.classList.remove('current');
        });
    }

    playSound(instrumentName) {
        const instrument = this.instruments.find(inv => inv.name === instrumentName);
        if (!instrument) return;

        // Resume audio context if suspended (browser autoplay policy)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = instrument.type;
        oscillator.frequency.setValueAtTime(instrument.frequency, this.audioContext.currentTime);

        // Envelope for percussive sound
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.bakeryBeats = new BakeryBeats();
});
