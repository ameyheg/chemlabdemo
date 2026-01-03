// ReactionManager - Handles chemical reaction lookups and processing

import type { Chemical, ChemicalType, Reaction, ReactionResult, VesselContents } from './types';

/**
 * Pre-defined chemicals database
 */
export const CHEMICALS: Record<string, Chemical> = {
    water: {
        id: 'water',
        name: 'Water',
        formula: 'H₂O',
        color: '#4fc3f7',
        type: 'water',
    },
    hydrochloric_acid: {
        id: 'hydrochloric_acid',
        name: 'Hydrochloric Acid',
        formula: 'HCl',
        color: '#c8e6c9',
        type: 'acid',
        concentration: 1.0,
    },
    sodium_hydroxide: {
        id: 'sodium_hydroxide',
        name: 'Sodium Hydroxide',
        formula: 'NaOH',
        color: '#e1bee7',
        type: 'base',
        concentration: 1.0,
    },
    zinc: {
        id: 'zinc',
        name: 'Zinc Metal',
        formula: 'Zn',
        color: '#b0bec5',
        type: 'metal',
    },
    sodium_chloride: {
        id: 'sodium_chloride',
        name: 'Sodium Chloride (Salt)',
        formula: 'NaCl',
        color: '#ffffff',
        type: 'salt',
    },
    // Phase 5: New chemicals
    phenolphthalein: {
        id: 'phenolphthalein',
        name: 'Phenolphthalein',
        formula: 'C₂₀H₁₄O₄',
        color: '#ffccff',  // Light pink (will be colorless in solution)
        type: 'indicator' as ChemicalType,
    },
    sulfuric_acid: {
        id: 'sulfuric_acid',
        name: 'Sulfuric Acid',
        formula: 'H₂SO₄',
        color: '#e8f5e9',
        type: 'acid',
        concentration: 1.0,
    },
    barium_chloride: {
        id: 'barium_chloride',
        name: 'Barium Chloride',
        formula: 'BaCl₂',
        color: '#e3f2fd',
        type: 'salt',
    },
    silver_nitrate: {
        id: 'silver_nitrate',
        name: 'Silver Nitrate',
        formula: 'AgNO₃',
        color: '#f5f5f5',
        type: 'salt',
    },
    barium_sulfate: {
        id: 'barium_sulfate',
        name: 'Barium Sulfate',
        formula: 'BaSO₄',
        color: '#ffffff',
        type: 'salt',
    },
    silver_chloride: {
        id: 'silver_chloride',
        name: 'Silver Chloride',
        formula: 'AgCl',
        color: '#f5f5f5',
        type: 'salt',
    },
};

/**
 * Reaction rules database
 */
export const REACTIONS: Reaction[] = [
    {
        id: 'acid_base_neutralization',
        name: 'Acid-Base Neutralization',
        description: 'When an acid reacts with a base, they neutralize each other to form water and a salt.',
        reactants: {
            chemicalType1: 'acid',
            chemicalType2: 'base',
        },
        products: [CHEMICALS.water, CHEMICALS.sodium_chloride],
        resultColor: '#e0f7fa',
        effects: ['color_change', 'heat'],
        isExothermic: true,
    },
    {
        id: 'acid_metal_reaction',
        name: 'Acid-Metal Reaction',
        description: 'When an acid reacts with a reactive metal, it produces hydrogen gas and a salt.',
        reactants: {
            chemicalType1: 'acid',
            chemicalType2: 'metal',
        },
        products: [
            {
                id: 'hydrogen_gas',
                name: 'Hydrogen Gas',
                formula: 'H₂',
                color: 'transparent',
                type: 'neutral',
            },
            {
                id: 'zinc_chloride',
                name: 'Zinc Chloride',
                formula: 'ZnCl₂',
                color: '#f5f5f5',
                type: 'salt',
            },
        ],
        resultColor: '#f5f5f5',
        effects: ['bubbles', 'heat'],
        isExothermic: true,
    },
    // Phase 5: indicator + base = pink color
    {
        id: 'indicator_base',
        name: 'Indicator Color Change',
        description: 'Phenolphthalein turns pink in basic solutions!',
        reactants: {
            chemicalType1: 'indicator' as ChemicalType,
            chemicalType2: 'base',
        },
        products: [CHEMICALS.sodium_hydroxide],
        resultColor: '#ff66b2',  // Bright pink
        effects: ['color_change'],
        isExothermic: false,
    },
    // Phase 5: BaCl2 + H2SO4 precipitation
    {
        id: 'barium_sulfate_precipitation',
        name: 'Precipitation Reaction',
        description: 'Barium chloride reacts with sulfuric acid to form white barium sulfate precipitate!',
        reactants: {
            chemicalType1: 'salt',
            chemicalType2: 'acid',
        },
        products: [CHEMICALS.barium_sulfate],
        resultColor: '#ffffff',
        effects: ['precipitate'],
        isExothermic: false,
    },
];

/**
 * ReactionManager class
 */
export class ReactionManager {
    private reactions: Reaction[];

    constructor() {
        this.reactions = REACTIONS;
    }

    findReaction(type1: ChemicalType, type2: ChemicalType): Reaction | null {
        return (
            this.reactions.find((reaction) => {
                const { chemicalType1, chemicalType2 } = reaction.reactants;
                return (
                    (chemicalType1 === type1 && chemicalType2 === type2) ||
                    (chemicalType1 === type2 && chemicalType2 === type1)
                );
            }) || null
        );
    }

    checkReaction(contents: VesselContents[]): ReactionResult {
        if (contents.length < 2) {
            return { occurred: false, message: 'Not enough chemicals to react.' };
        }

        for (let i = 0; i < contents.length; i++) {
            for (let j = i + 1; j < contents.length; j++) {
                const chemical1 = contents[i].chemical;
                const chemical2 = contents[j].chemical;
                const reaction = this.findReaction(chemical1.type, chemical2.type);

                if (reaction) {
                    return {
                        occurred: true,
                        reaction,
                        products: reaction.products,
                        message: `Reaction! ${reaction.name}: ${reaction.description}`,
                    };
                }
            }
        }

        return { occurred: false, message: 'No reaction occurred.' };
    }

    getAllReactions(): Reaction[] {
        return [...this.reactions];
    }

    getChemical(id: string): Chemical | undefined {
        return CHEMICALS[id];
    }
}

export const reactionManager = new ReactionManager();
