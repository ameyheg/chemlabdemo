// Experiment Data - NCERT Curriculum Classes 6-8
// Ported from 2D Virtual Chemistry Lab

export interface ExperimentChemical {
    id: string;
    name: string;
    color: string;
}

export interface ExperimentVisual {
    liquidColor?: string;
    particles?: boolean;
    settled?: boolean;
    steam?: boolean;
    crystals?: boolean;
    pouring?: boolean;
    filtered?: boolean;
    melting?: boolean;
    burning?: boolean;
    ash?: boolean;
    brightFlame?: boolean;
    indicatorChange?: boolean;
    indicatorAdded?: boolean;
    neutralized?: boolean;
}

export interface ExperimentReaction {
    observation: string;
    explanation: string;
    visual: ExperimentVisual;
    success: boolean;
    resultType?: string;
}

export interface Experiment {
    id: string;
    title: string;
    chapter: string;
    classLevel: number;
    aim: string;
    apparatus: string[];
    chemicals: ExperimentChemical[];
    reactions: Record<string, ExperimentReaction>;
    conclusion: string;
    procedureSteps?: string[];
}

export interface ExperimentState {
    currentExperiment: Experiment | null;
    experimentMode: 'sandbox' | 'guided';
    placedApparatus: string[];
    addedChemicals: string[];
    experimentActions: string[];
    observationHistory: string[];
    currentObservation: string;
    currentExplanation: string;
    showExplanation: boolean;
    completedExperiments: string[];
    heatLevel: number;
    stirCount: number;
}

// ==================== CLASS 6 EXPERIMENTS ====================
const class6Experiments: Experiment[] = [
    {
        id: 'salt-dissolution',
        title: 'Dissolving Salt vs Sand in Water',
        chapter: 'Separation of Substances',
        classLevel: 6,
        aim: 'To study the solubility of salt and sand in water.',
        apparatus: ['beaker', 'glass-rod'],
        chemicals: [
            { id: 'water', name: 'Water', color: '#a8d4ff' },
            { id: 'salt', name: 'Common Salt', color: '#d0e8ff' },
            { id: 'sand', name: 'Sand', color: '#c4a465' }
        ],
        procedureSteps: [
            'Place the beaker on the lab bench',
            'Add water to the beaker',
            'Add salt to the water',
            'Place the glass rod',
            'Stir the mixture with glass rod',
            'Observe - then Reset and repeat with sand'
        ],
        reactions: {
            'water+salt+stir': {
                observation: 'The salt crystals gradually disappear as you stir. The solution becomes slightly milky.',
                explanation: 'Salt (sodium chloride) is soluble in water. Water molecules surround the salt ions (Na⁺ and Cl⁻) and pull them apart, distributing them evenly throughout the solution. This is called dissolution.',
                visual: { liquidColor: '#e8f4ff', particles: false },
                success: true
            },
            'water+sand+stir': {
                observation: 'The sand particles swirl around but settle at the bottom when stirring stops. The water becomes slightly cloudy.',
                explanation: 'Sand (silicon dioxide) is insoluble in water. The water molecules cannot break apart the strong bonds in sand particles. Sand is denser than water, so it sinks and settles at the bottom.',
                visual: { liquidColor: '#d4c4a8', particles: true, settled: true },
                success: true
            },
            'water+salt': {
                observation: 'Salt crystals are sitting in the water. Nothing much is happening yet.',
                explanation: 'Try stirring the mixture to help the salt dissolve faster. Stirring increases the contact between water molecules and salt crystals.',
                visual: { liquidColor: '#a8d4ff', particles: true },
                success: false
            },
            'water+sand': {
                observation: 'Sand has sunk to the bottom of the beaker. The water above is clear.',
                explanation: 'Sand is denser than water and insoluble, so it naturally settles at the bottom.',
                visual: { liquidColor: '#a8d4ff', particles: true, settled: true },
                success: false
            }
        },
        conclusion: 'Salt is soluble in water and forms a clear solution. Sand is insoluble in water and settles at the bottom. This difference in solubility can be used to separate mixtures of salt and sand.'
    },
    {
        id: 'filtration',
        title: 'Separation by Filtration',
        chapter: 'Separation of Substances',
        classLevel: 6,
        aim: 'To separate insoluble impurities from water using filtration.',
        apparatus: ['beaker', 'funnel', 'filter-paper'],
        chemicals: [
            { id: 'muddy-water', name: 'Muddy Water', color: '#8b7355' }
        ],
        procedureSteps: [
            'Place a beaker on the lab bench',
            'Place the funnel on the lab bench',
            'Place the filter paper in the funnel',
            'Add muddy water to the beaker',
            'Pour the muddy water through the funnel',
            'Observe the transparent water collected below'
        ],
        reactions: {
            'muddy-water': {
                observation: 'Muddy water is in the beaker. The water appears brown and cloudy with suspended mud particles.',
                explanation: 'Muddy water is a mixture of water and insoluble mud particles. To separate them, you need to set up a filtration apparatus.',
                visual: { liquidColor: '#8b7355', particles: true },
                success: false
            },
            'muddy-water+pour': {
                observation: 'You are pouring the muddy water into the funnel... Watch as the filter paper separates the mud from the water!',
                explanation: 'The muddy water passes through the filter paper. Water molecules are small enough to pass through the tiny pores, but mud particles are too large and get trapped.',
                visual: { pouring: true },
                success: false
            },
            'muddy-water+pour+filter': {
                observation: 'Filtration complete! Clear water has collected in the beaker below. The brown mud residue is trapped on the filter paper.',
                explanation: 'Filtration separates insoluble solid particles from a liquid. The filter paper acts as a barrier - it allows water molecules to pass through but traps the larger mud particles.',
                visual: { liquidColor: '#c8e0ff', particles: false, filtered: true },
                success: true
            }
        },
        conclusion: 'Filtration is used to separate insoluble solids from liquids. The filter paper traps solid particles while allowing the liquid to pass through. This method is used to purify drinking water and in many industrial processes.'
    },
    {
        id: 'evaporation',
        title: 'Separation by Evaporation',
        chapter: 'Separation of Substances',
        classLevel: 6,
        aim: 'To obtain salt from salt solution by evaporation.',
        apparatus: ['tripod-stand', 'burner', 'china-dish'],
        chemicals: [
            { id: 'salt-solution', name: 'Salt Solution', color: '#e8f4ff' }
        ],
        procedureSteps: [
            'Place the tripod stand on the lab bench',
            'Place the burner under the tripod stand',
            'Place the china dish on the tripod stand',
            'Add salt solution to the china dish',
            'Heat the solution and observe evaporation',
            'Observe the salt crystals left behind'
        ],
        reactions: {
            'salt-solution': {
                observation: 'Clear salt solution is in the china dish. The solution looks like plain water but contains dissolved salt.',
                explanation: 'Salt solution is a homogeneous mixture where salt is completely dissolved in water. To recover the salt, you need to evaporate the water.',
                visual: { liquidColor: '#e8f4ff', particles: false },
                success: false
            },
            'salt-solution+heat': {
                observation: 'As you heat the solution, you can see steam rising. The water level is decreasing gradually.',
                explanation: 'Heat provides energy for water molecules to escape as water vapor (steam). Keep heating to evaporate all the water.',
                visual: { liquidColor: '#e8f4ff', steam: true },
                success: false
            },
            'salt-solution+heat+evaporate': {
                observation: 'All the water has evaporated! White salt crystals are left behind at the bottom of the china dish.',
                explanation: 'When water evaporates, the dissolved salt cannot escape with it because salt has a much higher boiling point. The salt crystallizes and remains in the dish. This is how sea salt is obtained from sea water!',
                visual: { liquidColor: 'transparent', crystals: true },
                success: true
            }
        },
        conclusion: 'Evaporation is used to separate a dissolved solid from a liquid. When the liquid evaporates, the solid is left behind. This method is used to obtain salt from sea water and in sugar production.'
    },
    {
        id: 'physical-chemical',
        title: 'Physical vs Chemical Change',
        chapter: 'Changes Around Us',
        classLevel: 6,
        aim: 'To distinguish between physical and chemical changes.',
        apparatus: ['burner', 'tripod-stand', 'beaker', 'tongs'],
        chemicals: [
            { id: 'ice', name: 'Ice Cubes', color: '#e0f4ff' },
            { id: 'paper', name: 'Paper Strip', color: '#f5f5dc' },
            { id: 'magnesium', name: 'Magnesium Ribbon', color: '#d4d4d4' }
        ],
        procedureSteps: [
            "Click 'Tripod Stand' to place it on the bench",
            "Click 'Burner' to place it under the stand",
            "Click 'Beaker' to place it on the stand",
            "Click 'Ice Cubes' to add them to the beaker",
            "Click the Burner to turn it ON (Observe Melting)",
            "Click the 'Reset' button to clear the workspace",
            "Click 'Burner' to place it on the bench",
            "Click 'Tongs' to place them",
            "Click 'Paper Strip' to hold it with tongs",
            "Click the Burner to turn it ON (Observe Burning)",
            "Click the 'Reset' button to clear the workspace",
            "Click 'Burner' to place it on the bench",
            "Click 'Tongs' to place them",
            "Click 'Magnesium Ribbon' to hold it",
            "Click the Burner to turn it ON (Observe White Flash)"
        ],
        reactions: {
            'ice+heat': {
                observation: 'The ice is melting! It is turning into liquid water. If you cool it again, it will become ice.',
                explanation: 'Melting of ice is a PHYSICAL CHANGE. Only the state changes (solid to liquid), but the substance remains water (H₂O). This change is reversible.',
                visual: { liquidColor: '#e0f4ff', melting: true },
                success: true
            },
            'paper+heat': {
                observation: 'The paper catches fire and burns! It turns into ash and smoke. You cannot get the paper back from ash.',
                explanation: 'Burning of paper is a CHEMICAL CHANGE. The paper reacts with oxygen to form new substances (ash, carbon dioxide, water vapor). This change is irreversible.',
                visual: { burning: true, ash: true },
                success: true
            },
            'magnesium+heat': {
                observation: 'The magnesium ribbon burns with a bright white flame! A white powder (magnesium oxide) is formed.',
                explanation: 'Burning of magnesium is a CHEMICAL CHANGE. Magnesium reacts with oxygen: 2Mg + O₂ → 2MgO. The white powder formed is magnesium oxide, a completely new substance.',
                visual: { burning: true, brightFlame: true },
                success: true
            }
        },
        conclusion: 'Physical changes are reversible and do not form new substances (melting, freezing, dissolving). Chemical changes are usually irreversible and form new substances (burning, rusting, cooking).'
    }
];

// ==================== CLASS 7 EXPERIMENTS ====================
const class7Experiments: Experiment[] = [
    {
        id: 'acids-bases',
        title: 'Testing Acids and Bases',
        chapter: 'Acids, Bases and Salts',
        classLevel: 7,
        aim: 'To test the nature of substances using litmus indicators and observe color changes.',
        apparatus: ['test-tube-stand', 'test-tube', 'dropper'],
        chemicals: [
            { id: 'vinegar', name: 'Vinegar (Acid)', color: '#fff8e0' },
            { id: 'lemon-juice', name: 'Lemon Juice (Acid)', color: '#fffacd' },
            { id: 'soap-solution', name: 'Soap Solution (Base)', color: '#e8f0ff' },
            { id: 'baking-soda', name: 'Baking Soda Soln (Base)', color: '#f8f8ff' },
            { id: 'blue-litmus', name: 'Blue Litmus', color: '#4169e1' },
            { id: 'red-litmus', name: 'Red Litmus', color: '#dc143c' }
        ],
        procedureSteps: [
            'Add vinegar to test tube',
            'Add blue litmus using dropper - observe color change',
            'Reset & add red litmus - observe',
            'Repeat for other substances'
        ],
        reactions: {
            'vinegar+blue-litmus': {
                observation: '🔴 The BLUE litmus turned RED! This confirms vinegar is an ACID.',
                explanation: 'Acids turn blue litmus paper/solution RED. Vinegar contains acetic acid which releases H⁺ ions in water.',
                visual: { liquidColor: '#ff6b6b', indicatorChange: true },
                success: true,
                resultType: 'acid'
            },
            'vinegar+red-litmus': {
                observation: 'The red litmus remains RED. No color change with red litmus in acid.',
                explanation: 'Red litmus does not change color in acidic solutions. To identify an acid, test with blue litmus.',
                visual: { liquidColor: '#ffb3b3' },
                success: true,
                resultType: 'acid-no-change'
            },
            'lemon-juice+blue-litmus': {
                observation: '🔴 The BLUE litmus turned RED! This confirms lemon juice is an ACID.',
                explanation: 'Lemon juice contains citric acid. Like all acids, it releases H⁺ ions which turn blue litmus red.',
                visual: { liquidColor: '#ff7777', indicatorChange: true },
                success: true,
                resultType: 'acid'
            },
            'lemon-juice+red-litmus': {
                observation: 'The red litmus remains RED. No color change with red litmus in acid.',
                explanation: 'Red litmus does not change color in acidic solutions.',
                visual: { liquidColor: '#ffb3b3' },
                success: true,
                resultType: 'acid-no-change'
            },
            'soap-solution+blue-litmus': {
                observation: 'The blue litmus remains BLUE. No color change with blue litmus in base.',
                explanation: 'Blue litmus does not change color in basic solutions.',
                visual: { liquidColor: '#87ceeb' },
                success: true,
                resultType: 'base-no-change'
            },
            'soap-solution+red-litmus': {
                observation: '🔵 The RED litmus turned BLUE! This confirms soap solution is a BASE.',
                explanation: 'Bases turn red litmus paper/solution BLUE. Soap solution releases OH⁻ ions in water.',
                visual: { liquidColor: '#6495ed', indicatorChange: true },
                success: true,
                resultType: 'base'
            },
            'baking-soda+blue-litmus': {
                observation: 'The blue litmus remains BLUE. No color change with blue litmus in base.',
                explanation: 'Blue litmus does not change color in basic solutions.',
                visual: { liquidColor: '#b0c4de' },
                success: true,
                resultType: 'base-no-change'
            },
            'baking-soda+red-litmus': {
                observation: '🔵 The RED litmus turned BLUE! This confirms baking soda solution is a BASE.',
                explanation: 'Baking soda (NaHCO₃) is a weak base that releases OH⁻ ions in water.',
                visual: { liquidColor: '#6495ed', indicatorChange: true },
                success: true,
                resultType: 'base'
            }
        },
        conclusion: 'Acids turn blue litmus red (due to H⁺ ions). Bases turn red litmus blue (due to OH⁻ ions). Common acids: vinegar, lemon juice. Common bases: soap, baking soda.'
    }
];

// ==================== CLASS 8 EXPERIMENTS ====================
const class8Experiments: Experiment[] = [
    {
        id: 'neutralization',
        title: 'Neutralization Reaction',
        chapter: 'Acids, Bases and Salts',
        classLevel: 8,
        aim: 'To study the reaction between an acid and a base using phenolphthalein indicator.',
        apparatus: ['beaker', 'dropper'],
        chemicals: [
            { id: 'naoh', name: 'NaOH Solution', color: '#e0e0ff' },
            { id: 'phenolphthalein', name: 'Phenolphthalein', color: '#ffb6c1' },
            { id: 'hcl', name: 'Dilute HCl', color: '#ffe0e0' }
        ],
        procedureSteps: [
            'Place the beaker on the lab bench',
            'Add NaOH solution to the beaker',
            'Add Phenolphthalein indicator',
            'Select the dropper from apparatus shelf',
            'Slowly add 5 drops of HCl to neutralize'
        ],
        reactions: {
            'naoh': {
                observation: 'Sodium hydroxide (NaOH) solution is in the beaker. It is a clear, colorless basic solution.',
                explanation: 'NaOH is a strong base that completely dissociates in water to form Na⁺ and OH⁻ ions.',
                visual: { liquidColor: '#e8e8ff' },
                success: false
            },
            'naoh+phenolphthalein': {
                observation: '💗 The solution turned PINK! Phenolphthalein indicates the presence of a base. Now add HCl to neutralize.',
                explanation: 'Phenolphthalein is colorless in acidic/neutral solutions but turns pink/magenta in basic solutions (pH > 8.2).',
                visual: { liquidColor: '#ff69b4', indicatorAdded: true },
                success: false
            },
            'naoh+phenolphthalein+hcl': {
                observation: '⚪ NEUTRALIZATION COMPLETE! The solution is now colorless - the acid has neutralized the base!',
                explanation: 'Complete neutralization: HCl + NaOH → NaCl + H₂O. The phenolphthalein turned colorless because the solution is no longer basic.',
                visual: { liquidColor: '#f5f5f5', neutralized: true },
                success: true
            }
        },
        conclusion: 'When an acid (HCl) reacts with a base (NaOH), they neutralize each other to form salt (NaCl) and water. Reaction: HCl + NaOH → NaCl + H₂O'
    }
];

// ==================== EXPORTS ====================
export const experimentsData: Record<number, Experiment[]> = {
    6: class6Experiments,
    7: class7Experiments,
    8: class8Experiments
};

export function getExperimentById(id: string): Experiment | undefined {
    for (const classLevel in experimentsData) {
        const experiment = experimentsData[Number(classLevel)].find(exp => exp.id === id);
        if (experiment) return experiment;
    }
    return undefined;
}

export function getExperimentsByClass(classLevel: number): Experiment[] {
    return experimentsData[classLevel] || [];
}

export function getAllExperiments(): Experiment[] {
    return Object.values(experimentsData).flat();
}

export function getTotalExperimentCount(): number {
    return getAllExperiments().length;
}
