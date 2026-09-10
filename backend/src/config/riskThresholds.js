module.exports = {
  dropped: {
    verticalVelocityThreshold: 60,   // positive = downward in pixel coords
    stopWindowFrames: 4,
    riskLevel: 'High',
  },
  dragging: {
    minHorizontalVelocity: 15,
    verticalVelocityMax: 5,
    minDurationFrames: 30,
    minHeightConsistency: 0.85,  // ratio: min_height / max_height over window
    defaultRiskLevel: 'Medium',
    hazardZones: ['wet_floor', 'chemical_storage'],
    hazardRiskLevel: 'High',
  },
  improperStacking: {
    sizeRatioHigh: 1.5,   // relative_size_vs_stacked > this → large on small
    sizeRatioLow: 0.6,    // < this → small on large (but light on heavy concern)
    mediumRiskLevel: 'Medium',
    highRiskLevel: 'High',
  },
  unstableStacking: {
    minOscillationFrames: 6,
    positionDeltaThreshold: 3,    // pixels
    aspectRatioDeltaThreshold: 0.05,
    riskLevel: 'High',
  },
  roughHandling: {
    peakVelocityThreshold: 90,
    impactWindowFrames: 5,
    defaultRiskLevel: 'High',
    withImpactRiskLevel: 'Critical',
  },
  outsideZone: {
    designatedZones: {
      box: ['loading_bay_1', 'loading_bay_2', 'storage_A', 'storage_B', 'staging_area'],
      carton: ['loading_bay_1', 'loading_bay_2', 'storage_A', 'storage_B', 'staging_area'],
      pallet: ['loading_bay_1', 'loading_bay_2', 'staging_area', 'dock_area'],
      crate: ['loading_bay_1', 'loading_bay_2', 'storage_A', 'storage_B'],
    },
    riskLevel: 'Medium',
  },
  steppingOnCartons: {
    minDwellSec: 1.5,
    targetClasses: ['box', 'carton', 'crate'],
    riskLevel: 'High',
  },
  wrongOrientation: {
    expectedAspectRatioRange: [0.7, 1.3],
    applicableClasses: ['box', 'carton', 'crate'],
    lowDeviationThreshold: 0.2,   // deviation from range boundary
    lowRiskLevel: 'Low',
    mediumRiskLevel: 'Medium',
  },
  palletOverhang: {
    overhangToleranceRatio: 0.1,
    riskLevel: 'Medium',
  },
  wrongEquipment: {
    riskLevel: 'Medium',
  },
};
