// Shadowrun 6th Edition Dice Roller
class ShadowrunDiceRoller {
    constructor() {
        this.rollHistory = [];
        this.currentRoll = null;
        this.settings = {
            ruleOfSix: true,
            glitchDetection: true,
            enableSounds: false,
            defaultEdge: 0
        };
        
        this.initializeElements();
        this.loadSettings();
        this.attachEventListeners();
    }

    initializeElements() {
        // Settings
        this.settingsToggle = document.getElementById('settingsToggle');
        this.settingsContent = document.getElementById('settingsContent');
        this.ruleOfSixCheckbox = document.getElementById('ruleOfSix');
        this.glitchDetectionCheckbox = document.getElementById('glitchDetection');
        this.enableSoundsCheckbox = document.getElementById('enableSounds');
        this.defaultEdgeInput = document.getElementById('defaultEdge');
        this.clearHistoryBtn = document.getElementById('clearHistory');

        // Inputs
        this.dicePoolInput = document.getElementById('dicePool');
        this.edgePointsInput = document.getElementById('edgePoints');
        this.rollButton = document.getElementById('rollButton');

        // Results
        this.resultsSection = document.getElementById('resultsSection');
        this.hitCount = document.getElementById('hitCount');
        this.glitchWarning = document.getElementById('glitchWarning');
        this.diceDisplay = document.getElementById('diceDisplay');
        this.edgeActions = document.getElementById('edgeActions');
        this.rollSummary = document.getElementById('rollSummary');
        this.historyList = document.getElementById('historyList');

        // Edge action buttons
        this.edgeRerollFailuresBtn = document.getElementById('edgeRerollFailures');
        this.edgeAddDiceBtn = document.getElementById('edgeAddDice');
        this.edgePushLimitBtn = document.getElementById('edgePushLimit');
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('shadowrunDiceSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }

        this.ruleOfSixCheckbox.checked = this.settings.ruleOfSix;
        this.glitchDetectionCheckbox.checked = this.settings.glitchDetection;
        this.enableSoundsCheckbox.checked = this.settings.enableSounds;
        this.defaultEdgeInput.value = this.settings.defaultEdge;
        this.edgePointsInput.value = this.settings.defaultEdge;

        // Load history
        const savedHistory = localStorage.getItem('shadowrunDiceHistory');
        if (savedHistory) {
            this.rollHistory = JSON.parse(savedHistory);
            this.updateHistoryDisplay();
        }
    }

    saveSettings() {
        localStorage.setItem('shadowrunDiceSettings', JSON.stringify(this.settings));
    }

    attachEventListeners() {
        // Settings toggle
        this.settingsToggle.addEventListener('click', () => {
            const isExpanded = this.settingsContent.style.display === 'block';
            this.settingsContent.style.display = isExpanded ? 'none' : 'block';
            this.settingsToggle.setAttribute('aria-expanded', !isExpanded);
        });

        // Settings changes
        this.ruleOfSixCheckbox.addEventListener('change', (e) => {
            this.settings.ruleOfSix = e.target.checked;
            this.saveSettings();
        });

        this.glitchDetectionCheckbox.addEventListener('change', (e) => {
            this.settings.glitchDetection = e.target.checked;
            this.saveSettings();
        });

        this.enableSoundsCheckbox.addEventListener('change', (e) => {
            this.settings.enableSounds = e.target.checked;
            this.saveSettings();
        });

        this.defaultEdgeInput.addEventListener('change', (e) => {
            this.settings.defaultEdge = parseInt(e.target.value) || 0;
            this.saveSettings();
        });

        this.clearHistoryBtn.addEventListener('click', () => {
            if (confirm('Clear all roll history?')) {
                this.rollHistory = [];
                localStorage.removeItem('shadowrunDiceHistory');
                this.updateHistoryDisplay();
            }
        });

        // Roll button
        this.rollButton.addEventListener('click', () => this.rollDice());

        // Edge action buttons
        this.edgeRerollFailuresBtn.addEventListener('click', () => this.useEdgeRerollFailures());
        this.edgeAddDiceBtn.addEventListener('click', () => this.useEdgeAddDice());
        this.edgePushLimitBtn.addEventListener('click', () => this.useEdgePushLimit());

        // Enter key support
        this.dicePoolInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.rollDice();
        });
        this.edgePointsInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.rollDice();
        });
    }

    rollDice() {
        const dicePool = parseInt(this.dicePoolInput.value) || 1;
        const edgePoints = parseInt(this.edgePointsInput.value) || 0;

        if (dicePool < 1 || dicePool > 99) {
            alert('Dice pool must be between 1 and 99');
            return;
        }

        if (edgePoints < 0 || edgePoints > 7) {
            alert('Edge points must be between 0 and 7');
            return;
        }

        const roll = this.performRoll(dicePool, edgePoints);
        this.currentRoll = roll;
        this.displayResults(roll);
        this.addToHistory(roll);
        this.updateEdgeActions(edgePoints);
    }

    performRoll(dicePool, edgePoints = 0) {
        const dice = [];
        let totalHits = 0;
        let ones = 0;
        let sixes = 0;

        // Roll initial dice
        for (let i = 0; i < dicePool; i++) {
            const value = this.rollDie();
            dice.push({
                value: value,
                exploded: false,
                original: true
            });

            if (value === 1) ones++;
            if (value === 6) sixes++;
            if (value >= 5) totalHits++;
        }

        // Apply Rule of Six (exploding dice)
        if (this.settings.ruleOfSix) {
            let explodedCount = sixes;
            while (explodedCount > 0) {
                const newValue = this.rollDie();
                dice.push({
                    value: newValue,
                    exploded: true,
                    original: false
                });
                if (newValue >= 5) totalHits++;
                if (newValue === 1) ones++;
                if (newValue === 6) {
                    explodedCount++;
                }
                explodedCount--;
            }
        }

        // Glitch detection
        let glitchType = null;
        if (this.settings.glitchDetection) {
            const originalDice = dice.filter(d => d.original);
            const originalHits = originalDice.filter(d => d.value >= 5).length;
            const originalOnes = originalDice.filter(d => d.value === 1).length;

            if (originalOnes > originalHits && originalOnes > 0) {
                glitchType = 'glitch';
            }
            if (originalOnes === dicePool && dicePool > 0) {
                glitchType = 'critical-glitch';
            }
        }

        return {
            dice: dice,
            hits: totalHits,
            ones: ones,
            glitchType: glitchType,
            dicePool: dicePool,
            edgePoints: edgePoints,
            timestamp: new Date().toISOString()
        };
    }

    rollDie() {
        return Math.floor(Math.random() * 6) + 1;
    }

    displayResults(roll) {
        this.resultsSection.style.display = 'block';
        this.hitCount.textContent = `${roll.hits} ${roll.hits === 1 ? 'Hit' : 'Hits'}`;

        // Display dice
        this.diceDisplay.innerHTML = '';
        roll.dice.forEach((die, index) => {
            const dieElement = document.createElement('div');
            dieElement.className = `die roll-animation dice-${die.value === 1 ? '1' : die.value >= 5 ? die.value : '2-4'} ${die.exploded ? 'exploded' : ''}`;
            dieElement.textContent = die.value;
            dieElement.style.animationDelay = `${index * 0.05}s`;
            this.diceDisplay.appendChild(dieElement);
        });

        // Glitch warning
        if (roll.glitchType) {
            this.glitchWarning.style.display = 'block';
            this.glitchWarning.className = `glitch-warning ${roll.glitchType}`;
            if (roll.glitchType === 'critical-glitch') {
                this.glitchWarning.textContent = '⚠️ CRITICAL GLITCH! ⚠️';
            } else {
                this.glitchWarning.textContent = '⚠️ GLITCH! ⚠️';
            }
        } else {
            this.glitchWarning.style.display = 'none';
        }

        // Roll summary
        const originalDice = roll.dice.filter(d => d.original);
        const explodedDice = roll.dice.filter(d => !d.original);
        let summary = `Rolled ${roll.dicePool} dice`;
        if (explodedDice.length > 0) {
            summary += ` (${explodedDice.length} exploded)`;
        }
        summary += `. ${roll.hits} hits total.`;
        if (roll.ones > 0) {
            summary += ` ${roll.ones} one(s) rolled.`;
        }
        this.rollSummary.textContent = summary;

        // Play sound if enabled
        if (this.settings.enableSounds) {
            this.playRollSound();
        }
    }

    updateEdgeActions(edgePoints) {
        if (edgePoints > 0 && this.currentRoll) {
            this.edgeActions.style.display = 'block';
            
            // Update button states based on available edge
            this.edgeRerollFailuresBtn.disabled = edgePoints < 1;
            this.edgeAddDiceBtn.disabled = edgePoints < 1;
            this.edgePushLimitBtn.disabled = edgePoints < 2;
        } else {
            this.edgeActions.style.display = 'none';
        }
    }

    useEdgeRerollFailures() {
        if (!this.currentRoll || this.edgePointsInput.value < 1) return;

        const currentEdge = parseInt(this.edgePointsInput.value);
        if (currentEdge < 1) {
            alert('Not enough Edge points!');
            return;
        }

        // Reroll failures (1-4)
        const failures = this.currentRoll.dice.filter(d => d.original && d.value < 5);
        if (failures.length === 0) {
            alert('No failures to reroll!');
            return;
        }

        const rerolledDice = [];
        failures.forEach(() => {
            const newValue = this.rollDie();
            rerolledDice.push({
                value: newValue,
                exploded: false,
                original: true,
                rerolled: true
            });
        });

        // Update current roll
        const originalDice = this.currentRoll.dice.filter(d => d.original && d.value >= 5);
        const explodedDice = this.currentRoll.dice.filter(d => !d.original);
        this.currentRoll.dice = [...originalDice, ...rerolledDice, ...explodedDice];

        // Recalculate hits
        this.currentRoll.hits = this.currentRoll.dice.filter(d => d.value >= 5).length;
        this.currentRoll.edgePoints = currentEdge - 1;

        // Update edge input
        this.edgePointsInput.value = this.currentRoll.edgePoints;

        // Redisplay results
        this.displayResults(this.currentRoll);
        this.updateEdgeActions(this.currentRoll.edgePoints);
    }

    useEdgeAddDice() {
        if (!this.currentRoll || this.edgePointsInput.value < 1) return;

        const currentEdge = parseInt(this.edgePointsInput.value);
        if (currentEdge < 1) {
            alert('Not enough Edge points!');
            return;
        }

        const diceToAdd = Math.min(currentEdge, 5); // Max 5 dice at once
        const newDice = [];
        for (let i = 0; i < diceToAdd; i++) {
            const value = this.rollDie();
            newDice.push({
                value: value,
                exploded: false,
                original: true,
                added: true
            });
        }

        // Add to current roll
        this.currentRoll.dice = [...this.currentRoll.dice, ...newDice];
        this.currentRoll.dicePool += diceToAdd;
        this.currentRoll.hits = this.currentRoll.dice.filter(d => d.value >= 5).length;
        this.currentRoll.edgePoints = currentEdge - diceToAdd;

        // Update edge input
        this.edgePointsInput.value = this.currentRoll.edgePoints;

        // Redisplay results
        this.displayResults(this.currentRoll);
        this.updateEdgeActions(this.currentRoll.edgePoints);
    }

    useEdgePushLimit() {
        if (!this.currentRoll || this.edgePointsInput.value < 2) return;

        const currentEdge = parseInt(this.edgePointsInput.value);
        if (currentEdge < 2) {
            alert('Not enough Edge points! Need 2 for Push the Limit.');
            return;
        }

        // Push the Limit: Reroll all non-hits
        const nonHits = this.currentRoll.dice.filter(d => d.original && d.value < 5);
        const hits = this.currentRoll.dice.filter(d => d.original && d.value >= 5);
        const explodedDice = this.currentRoll.dice.filter(d => !d.original);

        const rerolledDice = [];
        nonHits.forEach(() => {
            const newValue = this.rollDie();
            rerolledDice.push({
                value: newValue,
                exploded: false,
                original: true,
                pushed: true
            });
        });

        // Apply Rule of Six to new dice if enabled
        if (this.settings.ruleOfSix) {
            let newSixes = rerolledDice.filter(d => d.value === 6).length;
            while (newSixes > 0) {
                const newValue = this.rollDie();
                rerolledDice.push({
                    value: newValue,
                    exploded: true,
                    original: false
                });
                if (newValue === 6) {
                    newSixes++;
                }
                newSixes--;
            }
        }

        this.currentRoll.dice = [...hits, ...rerolledDice, ...explodedDice];
        this.currentRoll.hits = this.currentRoll.dice.filter(d => d.value >= 5).length;
        this.currentRoll.edgePoints = currentEdge - 2;

        // Update edge input
        this.edgePointsInput.value = this.currentRoll.edgePoints;

        // Redisplay results
        this.displayResults(this.currentRoll);
        this.updateEdgeActions(this.currentRoll.edgePoints);
    }

    addToHistory(roll) {
        this.rollHistory.unshift(roll);
        if (this.rollHistory.length > 50) {
            this.rollHistory = this.rollHistory.slice(0, 50);
        }
        localStorage.setItem('shadowrunDiceHistory', JSON.stringify(this.rollHistory));
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        this.historyList.innerHTML = '';
        if (this.rollHistory.length === 0) {
            this.historyList.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No rolls yet</p>';
            return;
        }

        this.rollHistory.forEach((roll, index) => {
            const item = document.createElement('div');
            item.className = 'history-item';
            
            const info = document.createElement('div');
            info.className = 'history-item-info';
            const time = new Date(roll.timestamp).toLocaleTimeString();
            let infoText = `${roll.dicePool} dice @ ${time}`;
            if (roll.glitchType) {
                infoText += ` - ${roll.glitchType === 'critical-glitch' ? 'CRITICAL GLITCH' : 'GLITCH'}`;
            }
            info.textContent = infoText;
            
            const hits = document.createElement('div');
            hits.className = 'history-item-hits';
            hits.textContent = `${roll.hits} ${roll.hits === 1 ? 'Hit' : 'Hits'}`;
            
            item.appendChild(info);
            item.appendChild(hits);
            this.historyList.appendChild(item);
        });
    }

    playRollSound() {
        // Simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }
}

// Initialize the dice roller when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ShadowrunDiceRoller();
});


