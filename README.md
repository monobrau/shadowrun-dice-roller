# Shadowrun 6th Edition Dice Roller

A web-based dice roller for Shadowrun 6th Edition with character stats management, automatic dice pool calculation, and full Edge action support.

## Features

### Core Dice Rolling
- **Shadowrun 6E Dice Mechanics**: Proper hit detection (5s and 6s count as hits)
- **Rule of Six**: Optional exploding dice on 6s
- **Glitch Detection**: 
  - Regular glitch: More than half of dice are ones
  - Critical glitch: All dice are ones
- **Visual Dice Display**: Color-coded dice with animations
- **Roll History**: Track your last 50 rolls with timestamps

### Character Stats Management
- **Attributes**: Track all 8 Shadowrun attributes (Body, Agility, Reaction, Strength, Willpower, Logic, Intuition, Charisma)
- **Custom Skills**: Add and manage custom skills with ratings
- **Automatic Dice Pool Calculation**: 
  - Select Attribute 1
  - Select Attribute 2 OR enter a skill name/rating
  - Add modifiers (-20 to +20)
  - Real-time calculated dice pool display
- **Skill Dropdown**: Quick selection from saved custom skills

### Edge Actions (SR6E Compliant)
- **Reroll One Die** (1 Edge): Select and reroll any single die
- **Add +1 to One Die** (2 Edge): Boost a die's value by 1 (max 6)
- **Buy Automatic Success** (3 Edge): Add one automatic hit

### Data Management
- **Local Storage**: All character data automatically saved in browser
- **Export/Import**: Save character data to JSON files for backup or sharing
- **Persistent Settings**: Dice rolling preferences saved between sessions

## How to Use

### Basic Rolling
1. Enter your dice pool size (or use calculated pool)
2. Enter your Edge points (0-7)
3. Click "Roll Dice"

### Using Character Stats
1. Click "👤 Character Stats" to expand the panel
2. Enter your character's attributes (1-12)
3. Configure dice pool calculation:
   - Select Attribute 1
   - Select Attribute 2 OR enter a skill
   - Add any modifiers
4. Check "Use Calculated Pool" to auto-fill dice pool
5. Roll as normal

### Adding Custom Skills
1. In the Character Stats panel, click "+ Add Skill"
2. Enter skill name and rating (0-12)
3. Skills appear in the dropdown for quick selection

### Using Edge Actions
1. After rolling, if you have Edge points, Edge Actions will appear
2. Click an Edge action button
3. For "Reroll One Die" or "Add +1 to Die", select which die to modify
4. The action is applied and Edge points are deducted

### Exporting/Importing Character
- **Export**: Click "💾 Export Character to File" to download a JSON file
- **Import**: Click "📂 Import Character from File" to load a saved character

## Settings

- **Rule of Six**: Enable/disable exploding dice on 6s
- **Glitch Detection**: Enable/disable glitch warnings
- **Dice Roll Sounds**: Optional audio feedback
- **Default Edge Points**: Set your character's starting Edge

## Technical Details

- Pure HTML, CSS, and JavaScript (no dependencies)
- LocalStorage for data persistence
- File API for export/import
- Responsive design for mobile and desktop

## Shadowrun 6E Rules Compliance

This dice roller follows Shadowrun 6th Edition rules:
- Hits on 5s and 6s
- Rule of Six for exploding dice
- Glitch detection (more than half dice are ones)
- Edge actions with correct costs
- Edge point limit of 7

## Browser Compatibility

Works in all modern browsers that support:
- ES6 JavaScript
- LocalStorage API
- File API
- CSS Grid and Flexbox

## License

This project is open source and available for personal use.

## Contributing

Feel free to submit issues or pull requests for improvements!

