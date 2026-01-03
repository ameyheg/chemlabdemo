// SoundManager - Synthesized sound effects for chemistry lab

class SoundManagerClass {
    private audioContext: AudioContext | null = null;
    private isInitialized = false;
    private activeSounds: Map<string, { oscillators: OscillatorNode[]; gains: GainNode[] }> = new Map();

    private getContext(): AudioContext {
        if (!this.audioContext) {
            this.audioContext = new AudioContext();
        }
        return this.audioContext;
    }

    // Initialize audio context (must be called from user interaction)
    async initialize(): Promise<void> {
        if (this.isInitialized) return;
        const ctx = this.getContext();
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }
        this.isInitialized = true;
    }

    // Bubbling sound - realistic multi-layered bubbles for acid-metal reaction
    playBubbles(id: string, duration: number = 4000): void {
        this.initialize();
        const ctx = this.getContext();

        const oscillators: OscillatorNode[] = [];
        const gains: GainNode[] = [];

        // Layer 1: Continuous fizzing undertone (white noise filtered)
        const fizzBufferSize = ctx.sampleRate * (duration / 1000);
        const fizzBuffer = ctx.createBuffer(1, fizzBufferSize, ctx.sampleRate);
        const fizzOutput = fizzBuffer.getChannelData(0);
        for (let i = 0; i < fizzBufferSize; i++) {
            fizzOutput[i] = (Math.random() * 2 - 1) * 0.3;
        }

        const fizzNoise = ctx.createBufferSource();
        fizzNoise.buffer = fizzBuffer;

        const fizzFilter = ctx.createBiquadFilter();
        fizzFilter.type = 'highpass';
        fizzFilter.frequency.value = 4000;

        const fizzGain = ctx.createGain();
        fizzGain.gain.setValueAtTime(0, ctx.currentTime);
        fizzGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.3);
        fizzGain.gain.setValueAtTime(0.04, ctx.currentTime + duration / 1000 - 0.5);
        fizzGain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration / 1000);

        fizzNoise.connect(fizzFilter);
        fizzFilter.connect(fizzGain);
        fizzGain.connect(ctx.destination);
        fizzNoise.start();

        gains.push(fizzGain);
        (this.activeSounds.set(id, { oscillators, gains }) as any);
        (this.activeSounds.get(id) as any).fizzNoise = fizzNoise;

        // Layer 2: Random bubble pops (small, medium, large)
        const bubbleCount = Math.floor(duration / 60); // More bubbles

        for (let i = 0; i < bubbleCount; i++) {
            const delay = Math.random() * duration * 0.9;

            // Vary bubble size: small (high freq), medium, large (low freq)
            const bubbleType = Math.random();
            let baseFreq: number;
            let volume: number;
            let popDuration: number;

            if (bubbleType < 0.5) {
                // Small bubbles - high pitch, quiet
                baseFreq = 400 + Math.random() * 300;
                volume = 0.03 + Math.random() * 0.02;
                popDuration = 0.04 + Math.random() * 0.03;
            } else if (bubbleType < 0.85) {
                // Medium bubbles
                baseFreq = 200 + Math.random() * 200;
                volume = 0.05 + Math.random() * 0.03;
                popDuration = 0.06 + Math.random() * 0.04;
            } else {
                // Large bubbles - low pitch, louder "blorp"
                baseFreq = 80 + Math.random() * 100;
                volume = 0.08 + Math.random() * 0.04;
                popDuration = 0.1 + Math.random() * 0.06;
            }

            setTimeout(() => {
                if (!this.activeSounds.has(id)) return;

                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const filter = ctx.createBiquadFilter();

                filter.type = 'lowpass';
                filter.frequency.value = 1200 + Math.random() * 800;

                // Sine wave for rounder bubble sound
                osc.type = 'sine';
                osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
                // Pitch rises as bubble pops
                osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.5, ctx.currentTime + popDuration * 0.7);
                osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, ctx.currentTime + popDuration);

                // Quick attack, natural decay
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.005);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + popDuration);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);

                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + popDuration + 0.01);
            }, delay);
        }

        // Layer 3: Occasional deep rumbles (gas release)
        const rumbleCount = Math.floor(duration / 800);
        for (let i = 0; i < rumbleCount; i++) {
            const delay = 200 + Math.random() * (duration - 500);

            setTimeout(() => {
                if (!this.activeSounds.has(id)) return;

                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(40 + Math.random() * 30, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(60 + Math.random() * 40, ctx.currentTime + 0.15);

                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.25);
            }, delay);
        }

        // Auto cleanup
        setTimeout(() => this.stopSound(id), duration);
    }

    // Sizzling/fizzing heat sound - dramatic acid-base neutralization
    playSizzle(id: string, duration: number = 3000): void {
        this.initialize();
        const ctx = this.getContext();

        const oscillators: OscillatorNode[] = [];
        const gains: GainNode[] = [];

        // Layer 1: Steam hiss (filtered white noise)
        const steamBufferSize = ctx.sampleRate * (duration / 1000);
        const steamBuffer = ctx.createBuffer(1, steamBufferSize, ctx.sampleRate);
        const steamOutput = steamBuffer.getChannelData(0);
        for (let i = 0; i < steamBufferSize; i++) {
            steamOutput[i] = Math.random() * 2 - 1;
        }

        const steamNoise = ctx.createBufferSource();
        steamNoise.buffer = steamBuffer;

        const steamFilter = ctx.createBiquadFilter();
        steamFilter.type = 'bandpass';
        steamFilter.frequency.value = 2500;
        steamFilter.Q.value = 1.5;

        const steamGain = ctx.createGain();
        steamGain.gain.setValueAtTime(0, ctx.currentTime);
        steamGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.15);
        steamGain.gain.setValueAtTime(0.08, ctx.currentTime + duration / 1000 - 0.4);
        steamGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

        // Modulate for dynamic crackling
        const steamLfo = ctx.createOscillator();
        const steamLfoGain = ctx.createGain();
        steamLfo.frequency.value = 12 + Math.random() * 6;
        steamLfoGain.gain.value = 800;
        steamLfo.connect(steamLfoGain);
        steamLfoGain.connect(steamFilter.frequency);

        steamNoise.connect(steamFilter);
        steamFilter.connect(steamGain);
        steamGain.connect(ctx.destination);

        steamLfo.start();
        steamNoise.start();

        gains.push(steamGain);
        oscillators.push(steamLfo);
        this.activeSounds.set(id, { oscillators, gains });
        (this.activeSounds.get(id) as any).steamNoise = steamNoise;

        // Layer 2: Crackling pops (random high-frequency bursts)
        const crackleCount = Math.floor(duration / 50);
        for (let i = 0; i < crackleCount; i++) {
            const delay = Math.random() * duration * 0.85;

            setTimeout(() => {
                if (!this.activeSounds.has(id)) return;

                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const filter = ctx.createBiquadFilter();

                filter.type = 'highpass';
                filter.frequency.value = 2000 + Math.random() * 2000;

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(800 + Math.random() * 1200, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.02);

                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.02 + Math.random() * 0.02, ctx.currentTime + 0.002);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02 + Math.random() * 0.02);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);

                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.05);
            }, delay);
        }

        // Layer 3: Energy whoosh (rising then falling tone)
        const whooshOsc = ctx.createOscillator();
        const whooshGain = ctx.createGain();
        const whooshFilter = ctx.createBiquadFilter();

        whooshOsc.type = 'sine';
        whooshOsc.frequency.setValueAtTime(80, ctx.currentTime);
        whooshOsc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + duration / 3000);
        whooshOsc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + duration / 1000);

        whooshFilter.type = 'lowpass';
        whooshFilter.frequency.value = 300;

        whooshGain.gain.setValueAtTime(0, ctx.currentTime);
        whooshGain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1);
        whooshGain.gain.setValueAtTime(0.1, ctx.currentTime + duration / 1000 - 0.3);
        whooshGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

        whooshOsc.connect(whooshFilter);
        whooshFilter.connect(whooshGain);
        whooshGain.connect(ctx.destination);

        whooshOsc.start();
        whooshOsc.stop(ctx.currentTime + duration / 1000 + 0.1);
        oscillators.push(whooshOsc);

        // Layer 4: Warming low-frequency hum (exothermic energy)
        const warmOsc = ctx.createOscillator();
        const warmGain = ctx.createGain();

        warmOsc.type = 'sine';
        warmOsc.frequency.setValueAtTime(55, ctx.currentTime);
        // Subtle vibrato
        const vibratoOsc = ctx.createOscillator();
        const vibratoGain = ctx.createGain();
        vibratoOsc.frequency.value = 4;
        vibratoGain.gain.value = 3;
        vibratoOsc.connect(vibratoGain);
        vibratoGain.connect(warmOsc.frequency);

        warmGain.gain.setValueAtTime(0, ctx.currentTime);
        warmGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.3);
        warmGain.gain.setValueAtTime(0.06, ctx.currentTime + duration / 1000 - 0.5);
        warmGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

        warmOsc.connect(warmGain);
        warmGain.connect(ctx.destination);

        vibratoOsc.start();
        warmOsc.start();
        warmOsc.stop(ctx.currentTime + duration / 1000 + 0.1);
        vibratoOsc.stop(ctx.currentTime + duration / 1000 + 0.1);

        oscillators.push(warmOsc, vibratoOsc);

        // Auto cleanup
        setTimeout(() => {
            this.stopSound(id);
        }, duration);
    }

    // Pouring liquid sound
    playPour(id: string): void {
        this.initialize();
        const ctx = this.getContext();

        // Brown noise (filtered white noise) for water
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.1);

        // Slight modulation for "glugging"
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 3;
        lfoGain.gain.value = 0.03;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        lfo.start();
        noise.start();

        this.activeSounds.set(id, {
            oscillators: [lfo],
            gains: [gain],
        });

        // Store refs for stopping
        (this.activeSounds.get(id) as any).noise = noise;
    }

    // Stop a specific sound
    stopSound(id: string): void {
        const sound = this.activeSounds.get(id);
        if (!sound) return;

        const ctx = this.getContext();

        // Immediately remove from active sounds to prevent restarts
        this.activeSounds.delete(id);

        // Fade out gains quickly
        sound.gains.forEach(gain => {
            try {
                gain.gain.cancelScheduledValues(ctx.currentTime);
                gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
            } catch (e) {
                // Ignore if already stopped
            }
        });

        // Stop oscillators and noise after short fade
        setTimeout(() => {
            sound.oscillators.forEach(osc => {
                try { osc.stop(); } catch (e) { }
            });
            // Stop noise sources if they exist
            if ((sound as any).noise) {
                try { (sound as any).noise.stop(); } catch (e) { }
            }
            if ((sound as any).fizzNoise) {
                try { (sound as any).fizzNoise.stop(); } catch (e) { }
            }
            if ((sound as any).steamNoise) {
                try { (sound as any).steamNoise.stop(); } catch (e) { }
            }
            if ((sound as any).flameNoise) {
                try { (sound as any).flameNoise.stop(); } catch (e) { }
            }
            if ((sound as any).rumbleNoise) {
                try { (sound as any).rumbleNoise.stop(); } catch (e) { }
            }
        }, 60);
    }

    // Play reaction sound based on effect type
    playReactionSound(effectType: string, id: string, duration: number): void {
        switch (effectType) {
            case 'bubbles':
                this.playBubbles(id, duration);
                break;
            case 'heat':
                this.playSizzle(id, duration);
                break;
            case 'boiling':
                this.playBoiling(id, duration);
                break;
            case 'steam':
                // Steam is visual only, no distinct sound
                break;
        }
    }

    // Bunsen burner flame sound - continuous gas whoosh
    playFlame(id: string): void {
        this.initialize();
        const ctx = this.getContext();

        // Brown noise for gas flow
        const bufferSize = ctx.sampleRate * 4;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
        }

        const flameNoise = ctx.createBufferSource();
        flameNoise.buffer = noiseBuffer;
        flameNoise.loop = true;

        // Bandpass for flame whoosh
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 400;
        filter.Q.value = 0.8;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.3);

        // Subtle flicker modulation
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 8 + Math.random() * 4;
        lfoGain.gain.value = 0.02;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);

        flameNoise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        lfo.start();
        flameNoise.start();

        this.activeSounds.set(id, {
            oscillators: [lfo],
            gains: [gain],
        });
        (this.activeSounds.get(id) as any).flameNoise = flameNoise;
    }

    // Boiling water sound - rapid bubbling
    playBoiling(id: string, duration: number = 5000): void {
        this.initialize();
        const ctx = this.getContext();

        const oscillators: OscillatorNode[] = [];
        const gains: GainNode[] = [];

        // Continuous rumbling undertone
        const rumbleBufferSize = ctx.sampleRate * (duration / 1000);
        const rumbleBuffer = ctx.createBuffer(1, rumbleBufferSize, ctx.sampleRate);
        const rumbleOutput = rumbleBuffer.getChannelData(0);

        let last = 0;
        for (let i = 0; i < rumbleBufferSize; i++) {
            const white = Math.random() * 2 - 1;
            rumbleOutput[i] = (last + 0.02 * white) / 1.02;
            last = rumbleOutput[i];
            rumbleOutput[i] *= 2;
        }

        const rumbleNoise = ctx.createBufferSource();
        rumbleNoise.buffer = rumbleBuffer;

        const rumbleFilter = ctx.createBiquadFilter();
        rumbleFilter.type = 'lowpass';
        rumbleFilter.frequency.value = 200;

        const rumbleGain = ctx.createGain();
        rumbleGain.gain.setValueAtTime(0, ctx.currentTime);
        rumbleGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.2);
        rumbleGain.gain.setValueAtTime(0.06, ctx.currentTime + duration / 1000 - 0.3);
        rumbleGain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration / 1000);

        rumbleNoise.connect(rumbleFilter);
        rumbleFilter.connect(rumbleGain);
        rumbleGain.connect(ctx.destination);
        rumbleNoise.start();

        gains.push(rumbleGain);
        this.activeSounds.set(id, { oscillators, gains });
        (this.activeSounds.get(id) as any).rumbleNoise = rumbleNoise;

        // Rapid bubble pops
        const bubbleCount = Math.floor(duration / 40);
        for (let i = 0; i < bubbleCount; i++) {
            const delay = Math.random() * duration * 0.9;

            setTimeout(() => {
                if (!this.activeSounds.has(id)) return;

                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                const freq = 150 + Math.random() * 250;
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(freq * 1.8, ctx.currentTime + 0.03);

                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.04 + Math.random() * 0.03, ctx.currentTime + 0.005);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.06);
            }, delay);
        }

        setTimeout(() => this.stopSound(id), duration);
    }

    // Safety Warning Sound - Impactful Alert
    playWarning(_id: string = 'warning'): void {
        this.initialize();
        const ctx = this.getContext();

        // 1. Main Alert Tone (Sawtooth for bite)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(440, ctx.currentTime); // A4
        // Slide down pitch for "Error" feel
        osc1.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.4);

        gain1.gain.setValueAtTime(0, ctx.currentTime);
        gain1.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05); // Louder (0.4)
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.5);

        // 2. Dissonant Layer (Square wave)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(430, ctx.currentTime); // Detuned slightly
        osc2.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.4);

        gain2.gain.setValueAtTime(0, ctx.currentTime);
        gain2.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.5);
    }

    // Play a single droplet sound (neutralization reaction)
    playDropSound(): void {
        this.initialize();
        const ctx = this.getContext();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // High frequency "plink"
        const freq = 1100 + Math.random() * 200;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        // Quick upward pitch slide on impact
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
    }

    // Stop all sounds
    stopAll(): void {
        this.activeSounds.forEach((_, id) => this.stopSound(id));
    }
}

export const SoundManager = new SoundManagerClass();
