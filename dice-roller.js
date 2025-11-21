// Shadowrun 6th Edition Dice Roller

// Constants
const MAX_EDGE = 7;
const MAX_DICE_POOL = 99;
const MIN_DICE_POOL = 1;
const MAX_ATTRIBUTE = 12;
const MIN_ATTRIBUTE = 1;
const MAX_SKILL = 12;
const MIN_SKILL = 0;
const MAX_MODIFIER = 20;
const MIN_MODIFIER = -20;
const MAX_HISTORY = 50;
const EDGE_COST_REROLL = 1;
const EDGE_COST_ADD_ONE = 2;
const EDGE_COST_BUY_SUCCESS = 3;

class ShadowrunDiceRoller {
    constructor() {
        this.rollHistory = [];
        this.currentRoll = null;
        this.audioContext = null; // Initialize audio context once
        this.settings = {
            ruleOfSix: true,
            glitchDetection: true,
            enableSounds: false,
            defaultEdge: 0
        };
        this.characterStats = {
            attributes: {
                body: 3,
                agility: 3,
                reaction: 3,
                strength: 3,
                willpower: 3,
                logic: 3,
                intuition: 3,
                charisma: 3
            },
            customSkills: {},
            poolConfig: {
                attribute1: '',
                attribute2: '',
                skillName: '',
                skillValue: 0,
                modifier: 0
            }
        };
        this.rollPresets = {};
        
        this.initializeElements();
        this.loadSettings();
        this.loadCharacterStats();
        this.loadPresets();
        this.attachEventListeners();
        this.updateCalculatedPool();
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
        this.edgeRerollOneDieBtn = document.getElementById('edgeRerollOneDie');
        this.edgeAddOneToDieBtn = document.getElementById('edgeAddOneToDie');
        this.edgeBuySuccessBtn = document.getElementById('edgeBuySuccess');
        this.dieSelectionArea = document.getElementById('dieSelectionArea');
        this.selectableDice = document.getElementById('selectableDice');
        this.cancelDieSelectionBtn = document.getElementById('cancelDieSelection');
        this.pendingEdgeAction = null; // Track which edge action is pending die selection

        // Character stats
        this.statsToggle = document.getElementById('statsToggle');
        this.statsContent = document.getElementById('statsContent');
        this.attrInputs = {
            body: document.getElementById('attrBody'),
            agility: document.getElementById('attrAgility'),
            reaction: document.getElementById('attrReaction'),
            strength: document.getElementById('attrStrength'),
            willpower: document.getElementById('attrWillpower'),
            logic: document.getElementById('attrLogic'),
            intuition: document.getElementById('attrIntuition'),
            charisma: document.getElementById('attrCharisma')
        };
        this.poolAttribute1 = document.getElementById('poolAttribute1');
        this.poolAttribute2 = document.getElementById('poolAttribute2');
        this.poolSkillSelect = document.getElementById('poolSkillSelect');
        this.poolSkill = document.getElementById('poolSkill');
        this.poolSkillValue = document.getElementById('poolSkillValue');
        this.poolModifier = document.getElementById('poolModifier');
        this.calculatedPool = document.getElementById('calculatedPool');
        this.useCalculatedPool = document.getElementById('useCalculatedPool');
        this.customSkillsList = document.getElementById('customSkillsList');
        this.addSkillBtn = document.getElementById('addSkillBtn');
        this.exportCharacterBtn = document.getElementById('exportCharacterBtn');
        this.importCharacterBtn = document.getElementById('importCharacterBtn');
        this.importCharacterFile = document.getElementById('importCharacterFile');

        // Presets
        this.presetsToggle = document.getElementById('presetsToggle');
        this.presetsContent = document.getElementById('presetsContent');
        this.savePresetBtn = document.getElementById('savePresetBtn');
        this.presetsList = document.getElementById('presetsList');

        // Opposed rolls
        this.opposedToggle = document.getElementById('opposedToggle');
        this.opposedContent = document.getElementById('opposedContent');
        this.attackerPool = document.getElementById('attackerPool');
        this.defenderPool = document.getElementById('defenderPool');
        this.rollAttackerBtn = document.getElementById('rollAttacker');
        this.rollDefenderBtn = document.getElementById('rollDefender');
        this.attackerResult = document.getElementById('attackerResult');
        this.defenderResult = document.getElementById('defenderResult');
        this.opposedOutcome = document.getElementById('opposedOutcome');
        this.resetOpposedBtn = document.getElementById('resetOpposed');
        this.opposedRolls = { attacker: null, defender: null };
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

    loadCharacterStats() {
        const savedStats = localStorage.getItem('shadowrunCharacterStats');
        if (savedStats) {
            const parsed = JSON.parse(savedStats);
            this.characterStats = { ...this.characterStats, ...parsed };
        }

        // Load attributes
        Object.keys(this.characterStats.attributes).forEach(attr => {
            if (this.attrInputs[attr]) {
                this.attrInputs[attr].value = this.characterStats.attributes[attr];
            }
        });

        // Load pool config
        if (this.characterStats.poolConfig) {
            this.poolAttribute1.value = this.characterStats.poolConfig.attribute1 || '';
            this.poolAttribute2.value = this.characterStats.poolConfig.attribute2 || '';
            this.poolSkill.value = this.characterStats.poolConfig.skillName || '';
            this.poolSkillValue.value = this.characterStats.poolConfig.skillValue || 0;
            this.poolModifier.value = this.characterStats.poolConfig.modifier || 0;
        }

        // Load custom skills
        if (this.characterStats.customSkills) {
            this.updateCustomSkillsDisplay();
            this.updateSkillDropdown();
        }
    }

    saveCharacterStats() {
        localStorage.setItem('shadowrunCharacterStats', JSON.stringify(this.characterStats));
    }

    loadPresets() {
        const savedPresets = localStorage.getItem('shadowrunRollPresets');
        if (savedPresets) {
            try {
                this.rollPresets = JSON.parse(savedPresets);
                this.updatePresetsDisplay();
            } catch (error) {
                console.error('Error loading presets:', error);
                this.rollPresets = {};
            }
        }
    }

    savePresets() {
        try {
            localStorage.setItem('shadowrunRollPresets', JSON.stringify(this.rollPresets));
        } catch (error) {
            console.error('Error saving presets:', error);
            alert('Error saving preset. Your browser storage may be full.');
        }
    }

    updateCalculatedPool() {
        let pool = 0;

        // Get attribute 1 value
        if (this.poolAttribute1.value) {
            const attr1Value = parseInt(this.attrInputs[this.poolAttribute1.value].value) || 0;
            pool += attr1Value;
        }

        // Get attribute 2 or skill value
        if (this.poolAttribute2.value) {
            const attr2Value = parseInt(this.attrInputs[this.poolAttribute2.value].value) || 0;
            pool += attr2Value;
        } else if (this.poolSkillSelect.value) {
            // Use custom skill from dropdown
            const skillName = this.poolSkillSelect.value;
            if (this.characterStats.customSkills[skillName]) {
                pool += this.characterStats.customSkills[skillName];
            }
        } else if (this.poolSkill.value.trim()) {
            // Check if it's a custom skill (by name match)
            const skillName = this.poolSkill.value.trim().toLowerCase();
            if (this.characterStats.customSkills[skillName]) {
                pool += this.characterStats.customSkills[skillName];
            } else {
                // Use manual skill value
                pool += parseInt(this.poolSkillValue.value) || 0;
            }
        }

        // Add modifier
        pool += parseInt(this.poolModifier.value) || 0;

        // Ensure minimum of 0
        pool = Math.max(0, pool);

        this.calculatedPool.textContent = pool;

        // Update dice pool input if "Use Calculated Pool" is checked
        if (this.useCalculatedPool.checked) {
            this.dicePoolInput.value = pool;
        }
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
            const value = parseInt(e.target.value) || 0;
            this.settings.defaultEdge = Math.max(0, Math.min(MAX_EDGE, value));
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
        this.edgeRerollOneDieBtn.addEventListener('click', () => this.initiateEdgeRerollOneDie());
        this.edgeAddOneToDieBtn.addEventListener('click', () => this.initiateEdgeAddOneToDie());
        this.edgeBuySuccessBtn.addEventListener('click', () => this.useEdgeBuySuccess());
        this.cancelDieSelectionBtn.addEventListener('click', () => this.cancelDieSelection());

        // Enter key support
        this.dicePoolInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.rollDice();
        });
        this.edgePointsInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.rollDice();
        });

        // Character stats toggle
        this.statsToggle.addEventListener('click', () => {
            const isExpanded = this.statsContent.getAttribute('aria-expanded') === 'true';
            const newState = !isExpanded;
            this.statsContent.style.display = newState ? 'block' : 'none';
            this.statsContent.setAttribute('aria-expanded', newState);
            this.statsToggle.setAttribute('aria-expanded', newState);
        });

        // Attribute inputs
        Object.keys(this.attrInputs).forEach(attr => {
            this.attrInputs[attr].addEventListener('input', (e) => {
                this.characterStats.attributes[attr] = parseInt(e.target.value) || 0;
                this.saveCharacterStats();
                this.updateCalculatedPool();
            });
        });

        // Pool configuration inputs
        this.poolAttribute1.addEventListener('change', () => {
            this.characterStats.poolConfig.attribute1 = this.poolAttribute1.value;
            this.saveCharacterStats();
            this.updateCalculatedPool();
        });

        this.poolAttribute2.addEventListener('change', () => {
            this.characterStats.poolConfig.attribute2 = this.poolAttribute2.value;
            if (this.poolAttribute2.value) {
                // Clear skill inputs when attribute is selected
                this.poolSkillSelect.value = '';
                this.poolSkill.value = '';
                this.poolSkillValue.value = 0;
                this.characterStats.poolConfig.skillName = '';
                this.characterStats.poolConfig.skillValue = 0;
            }
            this.saveCharacterStats();
            this.updateCalculatedPool();
        });

        this.poolSkillSelect.addEventListener('change', () => {
            const selectedSkill = this.poolSkillSelect.value;
            if (selectedSkill && this.characterStats.customSkills[selectedSkill]) {
                // Populate skill name and value from custom skill
                this.poolSkill.value = selectedSkill.charAt(0).toUpperCase() + selectedSkill.slice(1);
                this.poolSkillValue.value = this.characterStats.customSkills[selectedSkill];
                this.characterStats.poolConfig.skillName = selectedSkill;
                this.characterStats.poolConfig.skillValue = this.characterStats.customSkills[selectedSkill];
                // Clear attribute2 when skill is selected
                this.poolAttribute2.value = '';
                this.characterStats.poolConfig.attribute2 = '';
                this.saveCharacterStats();
                this.updateCalculatedPool();
            } else if (!selectedSkill) {
                // Clear skill inputs when "Select Custom Skill" is chosen
                this.poolSkill.value = '';
                this.poolSkillValue.value = 0;
                this.characterStats.poolConfig.skillName = '';
                this.characterStats.poolConfig.skillValue = 0;
                this.saveCharacterStats();
                this.updateCalculatedPool();
            }
        });

        this.poolSkill.addEventListener('input', () => {
            this.characterStats.poolConfig.skillName = this.poolSkill.value;
            if (this.poolSkill.value.trim()) {
                // Clear attribute2 and skill select when skill is manually entered
                this.poolAttribute2.value = '';
                this.poolSkillSelect.value = '';
                this.characterStats.poolConfig.attribute2 = '';
            }
            this.saveCharacterStats();
            this.updateCalculatedPool();
        });

        this.poolSkillValue.addEventListener('input', () => {
            this.characterStats.poolConfig.skillValue = parseInt(this.poolSkillValue.value) || 0;
            this.saveCharacterStats();
            this.updateCalculatedPool();
        });

        this.poolModifier.addEventListener('input', () => {
            this.characterStats.poolConfig.modifier = parseInt(this.poolModifier.value) || 0;
            this.saveCharacterStats();
            this.updateCalculatedPool();
        });

        this.useCalculatedPool.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.updateCalculatedPool();
            }
        });

        // Custom skills
        this.addSkillBtn.addEventListener('click', () => this.addCustomSkill());

        // File operations
        this.exportCharacterBtn.addEventListener('click', () => this.exportCharacterToFile());
        this.importCharacterBtn.addEventListener('click', () => this.importCharacterFile.click());
        this.importCharacterFile.addEventListener('change', (e) => this.importCharacterFromFile(e));

        // Presets toggle
        this.presetsToggle.addEventListener('click', () => {
            const isExpanded = this.presetsContent.style.display === 'block';
            this.presetsContent.style.display = isExpanded ? 'none' : 'block';
            this.presetsToggle.setAttribute('aria-expanded', !isExpanded);
        });

        // Save preset
        this.savePresetBtn.addEventListener('click', () => this.saveCurrentAsPreset());

        // Opposed rolls toggle
        this.opposedToggle.addEventListener('click', () => {
            const isExpanded = this.opposedContent.style.display === 'block';
            this.opposedContent.style.display = isExpanded ? 'none' : 'block';
            this.opposedToggle.setAttribute('aria-expanded', !isExpanded);
        });

        // Opposed roll buttons
        this.rollAttackerBtn.addEventListener('click', () => this.rollOpposedAttacker());
        this.rollDefenderBtn.addEventListener('click', () => this.rollOpposedDefender());
        this.resetOpposedBtn.addEventListener('click', () => this.resetOpposedRoll());
    }

    exportCharacterToFile() {
        try {
            const characterData = {
                attributes: this.characterStats.attributes,
                customSkills: this.characterStats.customSkills,
                poolConfig: this.characterStats.poolConfig,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };

            const jsonString = JSON.stringify(characterData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `shadowrun-character-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            alert('Character data exported successfully!');
        } catch (error) {
            console.error('Export error:', error);
            alert('Error exporting character data: ' + error.message);
        }
    }

    importCharacterFromFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);

                // Validate imported data structure and types
                if (!importedData || typeof importedData !== 'object') {
                    throw new Error('Invalid file format: Not a valid JSON object');
                }

                if (!importedData.attributes || typeof importedData.attributes !== 'object') {
                    throw new Error('Invalid character file format: Missing or invalid attributes');
                }

                if (!importedData.customSkills || typeof importedData.customSkills !== 'object') {
                    throw new Error('Invalid character file format: Missing or invalid custom skills');
                }

                if (!importedData.poolConfig || typeof importedData.poolConfig !== 'object') {
                    throw new Error('Invalid character file format: Missing or invalid pool config');
                }

                // Confirm import
                if (!confirm('This will replace your current character data. Continue?')) {
                    event.target.value = ''; // Reset file input
                    return;
                }

                // Import attributes with validation
                const validAttributes = ['body', 'agility', 'reaction', 'strength', 'willpower', 'logic', 'intuition', 'charisma'];
                Object.keys(importedData.attributes).forEach(attr => {
                    if (validAttributes.includes(attr) &&
                        this.attrInputs[attr] &&
                        typeof importedData.attributes[attr] === 'number' &&
                        importedData.attributes[attr] >= MIN_ATTRIBUTE &&
                        importedData.attributes[attr] <= MAX_ATTRIBUTE) {
                        this.characterStats.attributes[attr] = Math.floor(importedData.attributes[attr]);
                        this.attrInputs[attr].value = this.characterStats.attributes[attr];
                    }
                });

                // Import custom skills with validation
                this.characterStats.customSkills = {};
                Object.keys(importedData.customSkills).forEach(skillName => {
                    const skillValue = importedData.customSkills[skillName];
                    if (typeof skillName === 'string' &&
                        skillName.trim().length > 0 &&
                        typeof skillValue === 'number' &&
                        skillValue >= MIN_SKILL &&
                        skillValue <= MAX_SKILL) {
                        const sanitizedName = skillName.trim().toLowerCase().substring(0, 100); // Limit length
                        this.characterStats.customSkills[sanitizedName] = Math.floor(skillValue);
                    }
                });

                // Import pool config with validation
                if (importedData.poolConfig) {
                    const validAttrValues = ['', ...validAttributes];

                    this.characterStats.poolConfig = {
                        attribute1: validAttrValues.includes(importedData.poolConfig.attribute1) ? importedData.poolConfig.attribute1 : '',
                        attribute2: validAttrValues.includes(importedData.poolConfig.attribute2) ? importedData.poolConfig.attribute2 : '',
                        skillName: typeof importedData.poolConfig.skillName === 'string' ? importedData.poolConfig.skillName.substring(0, 100) : '',
                        skillValue: typeof importedData.poolConfig.skillValue === 'number' ?
                            Math.max(MIN_SKILL, Math.min(MAX_SKILL, Math.floor(importedData.poolConfig.skillValue))) : 0,
                        modifier: typeof importedData.poolConfig.modifier === 'number' ?
                            Math.max(MIN_MODIFIER, Math.min(MAX_MODIFIER, Math.floor(importedData.poolConfig.modifier))) : 0
                    };

                    // Update UI
                    this.poolAttribute1.value = this.characterStats.poolConfig.attribute1;
                    this.poolAttribute2.value = this.characterStats.poolConfig.attribute2;
                    this.poolSkill.value = this.characterStats.poolConfig.skillName;
                    this.poolSkillValue.value = this.characterStats.poolConfig.skillValue;
                    this.poolModifier.value = this.characterStats.poolConfig.modifier;
                }

                // Save to localStorage with error handling
                try {
                    this.saveCharacterStats();
                } catch (saveError) {
                    console.error('Save error:', saveError);
                    alert('Warning: Character data imported but could not be saved to browser storage');
                }

                // Update displays
                this.updateCustomSkillsDisplay();
                this.updateSkillDropdown();
                this.updateCalculatedPool();

                alert('Character data imported successfully!');
            } catch (error) {
                console.error('Import error:', error);
                alert('Error importing character data: ' + error.message);
            }
        };

        reader.onerror = () => {
            alert('Error reading file');
        };

        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    }

    addCustomSkill() {
        const skillName = prompt('Enter skill name:');
        if (!skillName || !skillName.trim()) return;

        const skillValue = prompt(`Enter skill rating (${MIN_SKILL}-${MAX_SKILL}):`);
        const value = parseInt(skillValue);
        if (isNaN(value) || value < MIN_SKILL || value > MAX_SKILL) {
            alert(`Skill rating must be between ${MIN_SKILL} and ${MAX_SKILL}`);
            return;
        }

        const normalizedName = skillName.trim().toLowerCase().substring(0, 100);
        this.characterStats.customSkills[normalizedName] = value;
        try {
            this.saveCharacterStats();
        } catch (error) {
            console.error('Save error:', error);
            alert('Error saving skill. Your browser storage may be full.');
            return;
        }
        this.updateCustomSkillsDisplay();
        this.updateSkillDropdown();
        this.updateCalculatedPool();
    }

    updateSkillDropdown() {
        // Clear existing options except the first one
        this.poolSkillSelect.innerHTML = '<option value="">Select Custom Skill</option>';
        
        // Add custom skills to dropdown
        Object.keys(this.characterStats.customSkills).forEach(skillName => {
            const option = document.createElement('option');
            option.value = skillName;
            option.textContent = `${skillName.charAt(0).toUpperCase() + skillName.slice(1)} (${this.characterStats.customSkills[skillName]})`;
            this.poolSkillSelect.appendChild(option);
        });
    }

    updateCustomSkillsDisplay() {
        this.customSkillsList.innerHTML = '';
        
        if (Object.keys(this.characterStats.customSkills).length === 0) {
            this.customSkillsList.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9em;">No custom skills added</p>';
            this.updateSkillDropdown();
            return;
        }

        Object.keys(this.characterStats.customSkills).forEach(skillName => {
            const skillItem = document.createElement('div');
            skillItem.className = 'custom-skill-item';
            
            const skillLabel = document.createElement('span');
            skillLabel.textContent = `${skillName.charAt(0).toUpperCase() + skillName.slice(1)}: ${this.characterStats.customSkills[skillName]}`;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '×';
            deleteBtn.className = 'delete-skill-btn';
            deleteBtn.addEventListener('click', () => {
                delete this.characterStats.customSkills[skillName];
                this.saveCharacterStats();
                this.updateCustomSkillsDisplay();
                this.updateSkillDropdown();
                this.updateCalculatedPool();
            });

            skillItem.appendChild(skillLabel);
            skillItem.appendChild(deleteBtn);
            this.customSkillsList.appendChild(skillItem);
        });

        // Update dropdown after adding/removing skills
        this.updateSkillDropdown();
    }

    saveCurrentAsPreset() {
        const presetName = prompt('Enter a name for this preset:');
        if (!presetName || !presetName.trim()) return;

        const sanitizedName = presetName.trim().substring(0, 50);

        // Get current pool configuration
        const preset = {
            name: sanitizedName,
            dicePool: parseInt(this.dicePoolInput.value) || MIN_DICE_POOL,
            useCalculatedPool: this.useCalculatedPool.checked,
            poolConfig: {
                attribute1: this.poolAttribute1.value,
                attribute2: this.poolAttribute2.value,
                skillName: this.poolSkill.value,
                skillValue: parseInt(this.poolSkillValue.value) || 0,
                modifier: parseInt(this.poolModifier.value) || 0
            }
        };

        const presetId = Date.now().toString();
        this.rollPresets[presetId] = preset;
        this.savePresets();
        this.updatePresetsDisplay();
    }

    loadPreset(presetId) {
        const preset = this.rollPresets[presetId];
        if (!preset) return;

        // Load dice pool settings
        this.dicePoolInput.value = preset.dicePool;
        this.useCalculatedPool.checked = preset.useCalculatedPool;

        // Load pool configuration
        if (preset.poolConfig) {
            this.poolAttribute1.value = preset.poolConfig.attribute1 || '';
            this.poolAttribute2.value = preset.poolConfig.attribute2 || '';
            this.poolSkill.value = preset.poolConfig.skillName || '';
            this.poolSkillValue.value = preset.poolConfig.skillValue || 0;
            this.poolModifier.value = preset.poolConfig.modifier || 0;

            // Update character stats poolConfig
            this.characterStats.poolConfig = {
                attribute1: preset.poolConfig.attribute1 || '',
                attribute2: preset.poolConfig.attribute2 || '',
                skillName: preset.poolConfig.skillName || '',
                skillValue: preset.poolConfig.skillValue || 0,
                modifier: preset.poolConfig.modifier || 0
            };
        }

        this.updateCalculatedPool();
    }

    deletePreset(presetId) {
        const preset = this.rollPresets[presetId];
        if (!preset) return;

        if (confirm(`Delete preset "${preset.name}"?`)) {
            delete this.rollPresets[presetId];
            this.savePresets();
            this.updatePresetsDisplay();
        }
    }

    updatePresetsDisplay() {
        this.presetsList.innerHTML = '';

        const presetIds = Object.keys(this.rollPresets);
        if (presetIds.length === 0) {
            this.presetsList.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9em;">No presets saved</p>';
            return;
        }

        presetIds.forEach(presetId => {
            const preset = this.rollPresets[presetId];
            const presetItem = document.createElement('div');
            presetItem.className = 'preset-item';

            const presetInfo = document.createElement('div');
            presetInfo.className = 'preset-info';
            presetInfo.addEventListener('click', () => this.loadPreset(presetId));

            const presetName = document.createElement('div');
            presetName.className = 'preset-name';
            presetName.textContent = preset.name;

            const presetDetails = document.createElement('div');
            presetDetails.className = 'preset-details';
            let detailsText = `Pool: ${preset.dicePool}`;
            if (preset.poolConfig && preset.poolConfig.attribute1) {
                detailsText += ` | ${preset.poolConfig.attribute1}`;
                if (preset.poolConfig.attribute2) {
                    detailsText += ` + ${preset.poolConfig.attribute2}`;
                } else if (preset.poolConfig.skillName) {
                    detailsText += ` + ${preset.poolConfig.skillName}`;
                }
                if (preset.poolConfig.modifier !== 0) {
                    detailsText += ` ${preset.poolConfig.modifier >= 0 ? '+' : ''}${preset.poolConfig.modifier}`;
                }
            }
            presetDetails.textContent = detailsText;

            presetInfo.appendChild(presetName);
            presetInfo.appendChild(presetDetails);

            const presetActions = document.createElement('div');
            presetActions.className = 'preset-actions';

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '×';
            deleteBtn.className = 'preset-delete-btn';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deletePreset(presetId);
            });

            presetActions.appendChild(deleteBtn);

            presetItem.appendChild(presetInfo);
            presetItem.appendChild(presetActions);
            this.presetsList.appendChild(presetItem);
        });
    }

    rollDice() {
        // Use calculated pool if enabled, otherwise use manual input
        let dicePool;
        if (this.useCalculatedPool.checked) {
            dicePool = parseInt(this.calculatedPool.textContent) || 0;
        } else {
            dicePool = parseInt(this.dicePoolInput.value) || MIN_DICE_POOL;
        }
        const edgePoints = parseInt(this.edgePointsInput.value) || 0;

        if (dicePool < MIN_DICE_POOL || dicePool > MAX_DICE_POOL) {
            alert(`Dice pool must be between ${MIN_DICE_POOL} and ${MAX_DICE_POOL}`);
            return;
        }

        if (edgePoints < 0 || edgePoints > MAX_EDGE) {
            alert(`Edge points must be between 0 and ${MAX_EDGE}`);
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

        // Glitch detection (SR6E: More than half of dice are ones)
        let glitchType = null;
        if (this.settings.glitchDetection) {
            const originalDice = dice.filter(d => d.original);
            const originalOnes = originalDice.filter(d => d.value === 1).length;
            const halfDice = Math.floor(originalDice.length / 2);

            // Critical glitch: All dice are ones
            if (originalOnes === dicePool && dicePool > 0) {
                glitchType = 'critical-glitch';
            }
            // Regular glitch: More than half of dice are ones
            else if (originalOnes > halfDice && originalOnes > 0) {
                glitchType = 'glitch';
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
            let dieClass = `die roll-animation dice-${die.value === 1 ? '1' : die.value >= 5 ? die.value : '2-4'}`;
            if (die.exploded) dieClass += ' exploded';
            if (die.rerolled) dieClass += ' rerolled';
            if (die.boosted) dieClass += ' boosted';
            dieElement.className = dieClass;
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
        summary += `. ${roll.hits} hits total`;
        if (roll.boughtSuccess) {
            summary += ` (1 bought with Edge)`;
        }
        summary += `.`;
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

            // Update button states based on available edge (SR6E rules)
            this.edgeRerollOneDieBtn.disabled = edgePoints < EDGE_COST_REROLL;
            this.edgeAddOneToDieBtn.disabled = edgePoints < EDGE_COST_ADD_ONE;
            this.edgeBuySuccessBtn.disabled = edgePoints < EDGE_COST_BUY_SUCCESS;
        } else {
            this.edgeActions.style.display = 'none';
            this.dieSelectionArea.style.display = 'none';
            this.pendingEdgeAction = null;
        }
    }

    cancelDieSelection() {
        this.dieSelectionArea.style.display = 'none';
        this.pendingEdgeAction = null;
        this.selectableDice.innerHTML = '';
    }

    initiateEdgeRerollOneDie() {
        if (!this.currentRoll || this.edgePointsInput.value < EDGE_COST_REROLL) return;

        const currentEdge = parseInt(this.edgePointsInput.value);
        if (currentEdge < EDGE_COST_REROLL) {
            alert(`Not enough Edge points! Need ${EDGE_COST_REROLL} Edge.`);
            return;
        }

        // Show die selection
        this.pendingEdgeAction = { type: 'reroll', cost: EDGE_COST_REROLL };
        this.showDieSelection();
    }

    initiateEdgeAddOneToDie() {
        if (!this.currentRoll || this.edgePointsInput.value < EDGE_COST_ADD_ONE) return;

        const currentEdge = parseInt(this.edgePointsInput.value);
        if (currentEdge < EDGE_COST_ADD_ONE) {
            alert(`Not enough Edge points! Need ${EDGE_COST_ADD_ONE} Edge.`);
            return;
        }

        // Show die selection
        this.pendingEdgeAction = { type: 'addOne', cost: EDGE_COST_ADD_ONE };
        this.showDieSelection();
    }

    showDieSelection() {
        this.selectableDice.innerHTML = '';
        
        // Show all dice from the current roll
        this.currentRoll.dice.forEach((die, index) => {
            const dieElement = document.createElement('div');
            dieElement.className = `die selectable-die dice-${die.value === 1 ? '1' : die.value >= 5 ? die.value : '2-4'} ${die.exploded ? 'exploded' : ''}`;
            dieElement.textContent = die.value;
            dieElement.dataset.dieIndex = index;
            dieElement.addEventListener('click', () => this.applyEdgeActionToDie(index));
            this.selectableDice.appendChild(dieElement);
        });

        this.dieSelectionArea.style.display = 'block';
    }

    applyEdgeActionToDie(dieIndex) {
        if (!this.pendingEdgeAction || !this.currentRoll) return;

        const die = this.currentRoll.dice[dieIndex];
        const currentEdge = parseInt(this.edgePointsInput.value);

        if (currentEdge < this.pendingEdgeAction.cost) {
            alert(`Not enough Edge points! Need ${this.pendingEdgeAction.cost} Edge.`);
            this.cancelDieSelection();
            return;
        }

        if (this.pendingEdgeAction.type === 'reroll') {
            // Reroll the selected die
            const newValue = this.rollDie();
            die.value = newValue;
            die.rerolled = true;
            
            // If it's a 6 and Rule of Six is enabled, add exploding dice
            if (newValue === 6 && this.settings.ruleOfSix) {
                let explodedCount = 1;
                while (explodedCount > 0) {
                    const explodedValue = this.rollDie();
                    this.currentRoll.dice.push({
                        value: explodedValue,
                        exploded: true,
                        original: false
                    });
                    if (explodedValue === 6) {
                        explodedCount++;
                    }
                    explodedCount--;
                }
            }

            this.currentRoll.edgePoints = currentEdge - 1;
        } else if (this.pendingEdgeAction.type === 'addOne') {
            // Add +1 to the selected die (max 6)
            if (die.value < 6) {
                die.value = Math.min(6, die.value + 1);
                die.boosted = true;
            } else {
                alert('Die is already at maximum value (6).');
                this.cancelDieSelection();
                return;
            }

            this.currentRoll.edgePoints = currentEdge - 2;
        }

        // Recalculate hits
        this.currentRoll.hits = this.currentRoll.dice.filter(d => d.value >= 5).length;

        // Update edge input
        this.edgePointsInput.value = this.currentRoll.edgePoints;

        // Hide selection and redisplay results
        this.cancelDieSelection();
        this.displayResults(this.currentRoll);
        this.updateEdgeActions(this.currentRoll.edgePoints);
    }

    useEdgeBuySuccess() {
        if (!this.currentRoll || this.edgePointsInput.value < EDGE_COST_BUY_SUCCESS) return;

        const currentEdge = parseInt(this.edgePointsInput.value);
        if (currentEdge < EDGE_COST_BUY_SUCCESS) {
            alert(`Not enough Edge points! Need ${EDGE_COST_BUY_SUCCESS} Edge for an automatic success.`);
            return;
        }

        // Buy one automatic success (SR6E: 3 Edge)
        this.currentRoll.hits += 1;
        this.currentRoll.edgePoints = currentEdge - EDGE_COST_BUY_SUCCESS;
        this.currentRoll.boughtSuccess = true;

        // Update edge input
        this.edgePointsInput.value = this.currentRoll.edgePoints;

        // Redisplay results
        this.displayResults(this.currentRoll);
        this.updateEdgeActions(this.currentRoll.edgePoints);
    }


    addToHistory(roll) {
        this.rollHistory.unshift(roll);
        if (this.rollHistory.length > MAX_HISTORY) {
            this.rollHistory = this.rollHistory.slice(0, MAX_HISTORY);
        }
        try {
            localStorage.setItem('shadowrunDiceHistory', JSON.stringify(this.rollHistory));
        } catch (error) {
            console.error('Error saving to history:', error);
            // Clear old history if storage is full
            this.rollHistory = this.rollHistory.slice(0, 10);
            try {
                localStorage.setItem('shadowrunDiceHistory', JSON.stringify(this.rollHistory));
            } catch (e) {
                console.error('Still unable to save history');
            }
        }
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

    rollOpposedAttacker() {
        const pool = parseInt(this.attackerPool.value) || MIN_DICE_POOL;
        if (pool < MIN_DICE_POOL || pool > MAX_DICE_POOL) {
            alert(`Dice pool must be between ${MIN_DICE_POOL} and ${MAX_DICE_POOL}`);
            return;
        }

        const roll = this.performRoll(pool, 0);
        this.opposedRolls.attacker = roll;
        this.displayOpposedResult(roll, this.attackerResult, 'Attacker');
        this.updateOpposedOutcome();
    }

    rollOpposedDefender() {
        const pool = parseInt(this.defenderPool.value) || MIN_DICE_POOL;
        if (pool < MIN_DICE_POOL || pool > MAX_DICE_POOL) {
            alert(`Dice pool must be between ${MIN_DICE_POOL} and ${MAX_DICE_POOL}`);
            return;
        }

        const roll = this.performRoll(pool, 0);
        this.opposedRolls.defender = roll;
        this.displayOpposedResult(roll, this.defenderResult, 'Defender');
        this.updateOpposedOutcome();
    }

    displayOpposedResult(roll, container, label) {
        container.innerHTML = '';

        const hitsDiv = document.createElement('div');
        hitsDiv.className = 'opposed-result-hits';
        hitsDiv.textContent = `${roll.hits} ${roll.hits === 1 ? 'Hit' : 'Hits'}`;
        container.appendChild(hitsDiv);

        const diceDiv = document.createElement('div');
        diceDiv.className = 'opposed-result-dice';
        roll.dice.forEach(die => {
            const dieElement = document.createElement('div');
            let dieClass = `die dice-${die.value === 1 ? '1' : die.value >= 5 ? die.value : '2-4'}`;
            if (die.exploded) dieClass += ' exploded';
            dieElement.className = dieClass;
            dieElement.textContent = die.value;
            diceDiv.appendChild(dieElement);
        });
        container.appendChild(diceDiv);

        // Play sound if enabled
        if (this.settings.enableSounds) {
            this.playRollSound();
        }
    }

    updateOpposedOutcome() {
        if (!this.opposedRolls.attacker || !this.opposedRolls.defender) {
            this.opposedOutcome.style.display = 'none';
            this.resetOpposedBtn.style.display = 'none';
            return;
        }

        const attackerHits = this.opposedRolls.attacker.hits;
        const defenderHits = this.opposedRolls.defender.hits;
        const netHits = attackerHits - defenderHits;

        this.opposedOutcome.innerHTML = '';
        this.opposedOutcome.style.display = 'block';
        this.resetOpposedBtn.style.display = 'block';

        const title = document.createElement('h3');
        title.textContent = 'Outcome';
        this.opposedOutcome.appendChild(title);

        const netHitsDiv = document.createElement('div');
        netHitsDiv.className = 'net-hits';

        const outcomeText = document.createElement('div');
        outcomeText.className = 'outcome-text';

        if (netHits > 0) {
            netHitsDiv.textContent = `${netHits} Net ${netHits === 1 ? 'Hit' : 'Hits'}`;
            netHitsDiv.style.color = 'var(--success)';
            outcomeText.textContent = 'Attacker Succeeds!';
        } else if (netHits < 0) {
            netHitsDiv.textContent = `${Math.abs(netHits)} Net ${Math.abs(netHits) === 1 ? 'Hit' : 'Hits'}`;
            netHitsDiv.style.color = 'var(--glitch)';
            outcomeText.textContent = 'Defender Succeeds!';
        } else {
            netHitsDiv.textContent = 'Tie';
            netHitsDiv.style.color = 'var(--text-secondary)';
            outcomeText.textContent = 'Both sides rolled equal hits';
        }

        this.opposedOutcome.appendChild(netHitsDiv);
        this.opposedOutcome.appendChild(outcomeText);
    }

    resetOpposedRoll() {
        this.opposedRolls.attacker = null;
        this.opposedRolls.defender = null;
        this.attackerResult.innerHTML = '';
        this.defenderResult.innerHTML = '';
        this.opposedOutcome.style.display = 'none';
        this.resetOpposedBtn.style.display = 'none';
    }

    playRollSound() {
        // Simple beep sound using Web Audio API
        // Create audio context only once to prevent memory leaks
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
}

// Initialize the dice roller when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ShadowrunDiceRoller();
});


