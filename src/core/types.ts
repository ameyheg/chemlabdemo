// Core type definitions for Virtual Chemistry Lab

/** Chemical type classification */
export type ChemicalType = 'acid' | 'base' | 'neutral' | 'metal' | 'salt' | 'water' | 'indicator';

/** Represents a chemical substance */
export interface Chemical {
  id: string;
  name: string;
  formula?: string;
  color: string;
  type: ChemicalType;
  concentration?: number;
}

/** Contents of a vessel - chemical and its volume */
export interface VesselContents {
  chemical: Chemical;
  volume: number;
}

/** Lab vessel (beaker, flask, test tube, etc.) */
export interface LabVessel {
  id: string;
  name?: string; // Optional display name (e.g., "Muddy Water Beaker")
  type: 'beaker' | 'flask' | 'test_tube' | 'graduated_cylinder' | 'tongs';
  capacity: number;
  currentVolume: number;
  tiltAngle: number;
  temperature: number; // in Celsius, room temp = 25
  contents: VesselContents[];
  position: [number, number, number];
}

/** Visual/audio effect for reactions */
export type ReactionEffect = 'bubbles' | 'smoke' | 'precipitate' | 'color_change' | 'heat' | 'explosion' | 'steam' | 'boiling';

/** Reaction rule definition */
export interface Reaction {
  id: string;
  name: string;
  description: string;
  reactants: {
    chemicalType1: ChemicalType;
    chemicalType2: ChemicalType;
  };
  products: Chemical[];
  resultColor: string;
  effects: ReactionEffect[];
  isExothermic?: boolean;
}

/** Result of a reaction check */
export interface ReactionResult {
  occurred: boolean;
  reaction?: Reaction;
  products?: Chemical[];
  message: string;
}

/** Lab store state */
export interface LabState {
  vessels: Map<string, LabVessel>;
  selectedVesselId: string | null;
}
