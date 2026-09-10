const dropped = require('../src/services/riskEngine/rules/dropped');
const dragging = require('../src/services/riskEngine/rules/dragging');
const improperStacking = require('../src/services/riskEngine/rules/improperStacking');
const roughHandling = require('../src/services/riskEngine/rules/roughHandling');
const outsideZone = require('../src/services/riskEngine/rules/outsideZone');
const steppingOnCartons = require('../src/services/riskEngine/rules/steppingOnCartons');
const scoreCalculator = require('../src/services/riskEngine/scoreCalculator');
const config = require('../src/config/riskThresholds');
const trackBufferService = require('../src/services/trackBufferService');

jest.mock('../src/services/trackBufferService');

describe('Risk Engine Rules', () => {
  const videoId = 'test_video';
  const allTracks = new Map();

  describe('dropped.js', () => {
    it('should detect dropped incident when velocity drops after spike', () => {
      const trackSeries = [
        { class: 'box', track_id: 1, frame: 1, timestamp_sec: 1, velocity_px_s: [0, 80] },
        { class: 'box', track_id: 1, frame: 2, timestamp_sec: 2, velocity_px_s: [0, 2] }
      ];
      const incidents = dropped.detect(trackSeries, allTracks, config, videoId);
      expect(incidents).toHaveLength(1);
      expect(incidents[0].behaviour).toBe('dropped');
      expect(incidents[0].risk_level).toBe(config.dropped.riskLevel);
    });

    it('should return empty array for steady low velocity', () => {
      const trackSeries = [
        { class: 'box', track_id: 2, frame: 1, timestamp_sec: 1, velocity_px_s: [0, 10] },
        { class: 'box', track_id: 2, frame: 2, timestamp_sec: 2, velocity_px_s: [0, 10] }
      ];
      const incidents = dropped.detect(trackSeries, allTracks, config, videoId);
      expect(incidents).toHaveLength(0);
    });

    it('should skip person objects', () => {
      const trackSeries = [
        { class: 'person', track_id: 3, frame: 1, timestamp_sec: 1, velocity_px_s: [0, 80] },
        { class: 'person', track_id: 3, frame: 2, timestamp_sec: 2, velocity_px_s: [0, 2] }
      ];
      const incidents = dropped.detect(trackSeries, allTracks, config, videoId);
      expect(incidents).toHaveLength(0);
    });
  });

  describe('dragging.js', () => {
    it('should detect dragging with 31+ frames of sustained horizontal velocity', () => {
      const trackSeries = [];
      for (let i = 1; i <= 35; i++) {
        trackSeries.push({
          class: 'box', track_id: 1, frame: i, timestamp_sec: i,
          velocity_px_s: [20, 2], height_px: 50, in_zone: 'staging_area'
        });
      }
      // Add one frame to end drag
      trackSeries.push({ class: 'box', track_id: 1, frame: 36, timestamp_sec: 36, velocity_px_s: [0, 0], height_px: 50 });
      
      const incidents = dragging.detect(trackSeries, allTracks, config, videoId);
      expect(incidents).toHaveLength(1);
      expect(incidents[0].behaviour).toBe('dragging');
    });

    it('should NOT detect dragging with fewer than 30 frames', () => {
      const trackSeries = [];
      for (let i = 1; i <= 25; i++) {
        trackSeries.push({
          class: 'box', track_id: 1, frame: i, timestamp_sec: i,
          velocity_px_s: [20, 2], height_px: 50
        });
      }
      trackSeries.push({ class: 'box', track_id: 1, frame: 26, timestamp_sec: 26, velocity_px_s: [0, 0], height_px: 50 });
      
      const incidents = dragging.detect(trackSeries, allTracks, config, videoId);
      expect(incidents).toHaveLength(0);
    });

    it('should NOT detect dragging if height changes significantly', () => {
      const trackSeries = [];
      for (let i = 1; i <= 35; i++) {
        trackSeries.push({
          class: 'box', track_id: 1, frame: i, timestamp_sec: i,
          velocity_px_s: [20, 2], height_px: i % 2 === 0 ? 50 : 100
        });
      }
      trackSeries.push({ class: 'box', track_id: 1, frame: 36, timestamp_sec: 36, velocity_px_s: [0, 0], height_px: 50 });
      
      const incidents = dragging.detect(trackSeries, allTracks, config, videoId);
      expect(incidents).toHaveLength(0);
    });
  });

  describe('improperStacking.js', () => {
    it('should detect improperStacking when relative_size_vs_stacked = 1.8', () => {
      const trackSeries = [
        { class: 'box', track_id: 1, frame: 1, timestamp_sec: 1, stacked_on_track_id: 2, relative_size_vs_stacked: 1.8 },
        { class: 'box', track_id: 1, frame: 2, timestamp_sec: 2, stacked_on_track_id: 2, relative_size_vs_stacked: 1.8 }
      ];
      const incidents = improperStacking.detect(trackSeries, allTracks, config, videoId);
      expect(incidents).toHaveLength(1);
      expect(incidents[0].behaviour).toBe('improperStacking');
      expect(incidents[0].risk_level).toBe(config.improperStacking.highRiskLevel);
    });

    it('should NOT detect improperStacking when relative_size_vs_stacked = 1.0', () => {
      const trackSeries = [
        { class: 'box', track_id: 1, frame: 1, timestamp_sec: 1, stacked_on_track_id: 2, relative_size_vs_stacked: 1.0 },
        { class: 'box', track_id: 1, frame: 2, timestamp_sec: 2, stacked_on_track_id: 2, relative_size_vs_stacked: 1.0 }
      ];
      const incidents = improperStacking.detect(trackSeries, allTracks, config, videoId);
      expect(incidents).toHaveLength(0);
    });
  });

  describe('roughHandling.js', () => {
    it('should detect roughHandling with Critical risk when peak velocity > 90 followed by impact', () => {
      const trackSeries = [
        { class: 'box', track_id: 1, frame: 1, timestamp_sec: 1, velocity_px_s: [100, 0] },
        { class: 'box', track_id: 1, frame: 2, timestamp_sec: 2, velocity_px_s: [10, 0] }
      ];
      const incidents = roughHandling.detect(trackSeries, allTracks, config, videoId);
      expect(incidents).toHaveLength(1);
      expect(incidents[0].behaviour).toBe('roughHandling');
      expect(incidents[0].risk_level).toBe(config.roughHandling.withImpactRiskLevel);
    });

    it('should detect roughHandling with High risk when peak velocity > 90 without impact', () => {
      const trackSeries = [
        { class: 'box', track_id: 1, frame: 1, timestamp_sec: 1, velocity_px_s: [100, 0] },
        { class: 'box', track_id: 1, frame: 2, timestamp_sec: 2, velocity_px_s: [100, 0] },
        { class: 'box', track_id: 1, frame: 3, timestamp_sec: 3, velocity_px_s: [100, 0] },
        { class: 'box', track_id: 1, frame: 4, timestamp_sec: 4, velocity_px_s: [100, 0] },
        { class: 'box', track_id: 1, frame: 5, timestamp_sec: 5, velocity_px_s: [100, 0] },
        { class: 'box', track_id: 1, frame: 6, timestamp_sec: 6, velocity_px_s: [100, 0] },
        { class: 'box', track_id: 1, frame: 7, timestamp_sec: 7, velocity_px_s: [100, 0] }
      ];
      const incidents = roughHandling.detect(trackSeries, allTracks, config, videoId);
      expect(incidents).toHaveLength(1);
      expect(incidents[0].behaviour).toBe('roughHandling');
      expect(incidents[0].risk_level).toBe(config.roughHandling.defaultRiskLevel);
    });
  });

  describe('outsideZone.js', () => {
    it('should detect outsideZone when in_zone = null for all frames', () => {
      const trackSeries = [
        { class: 'box', track_id: 1, frame: 1, timestamp_sec: 1, in_zone: null },
        { class: 'box', track_id: 1, frame: 2, timestamp_sec: 2, in_zone: null }
      ];
      const incidents = outsideZone.detect(trackSeries, allTracks, config, videoId);
      expect(incidents).toHaveLength(1);
      expect(incidents[0].behaviour).toBe('outsideZone');
    });

    it('should NOT detect outsideZone when in_zone is designated', () => {
      const trackSeries = [
        { class: 'box', track_id: 1, frame: 1, timestamp_sec: 1, in_zone: 'loading_bay_1' },
        { class: 'box', track_id: 1, frame: 2, timestamp_sec: 2, in_zone: 'loading_bay_1' }
      ];
      const incidents = outsideZone.detect(trackSeries, allTracks, config, videoId);
      expect(incidents).toHaveLength(0);
    });
  });

  describe('steppingOnCartons.js', () => {
    it('should detect steppingOnCartons with foot_overlap_track_id pointing to box and dwell_time_sec > 1.5', () => {
      trackBufferService.getTrackClass.mockReturnValue('box');
      const trackSeries = [
        { class: 'person', track_id: 1, frame: 1, timestamp_sec: 1, foot_overlap_track_id: 2 },
        { class: 'person', track_id: 1, frame: 2, timestamp_sec: 3, foot_overlap_track_id: 2 }
      ];
      const incidents = steppingOnCartons.detect(trackSeries, allTracks, config, videoId);
      expect(incidents).toHaveLength(1);
      expect(incidents[0].behaviour).toBe('steppingOnCartons');
    });

    it('should NOT detect steppingOnCartons without foot_overlap_track_id', () => {
      const trackSeries = [
        { class: 'person', track_id: 1, frame: 1, timestamp_sec: 1, foot_overlap_track_id: null },
        { class: 'person', track_id: 1, frame: 2, timestamp_sec: 3, foot_overlap_track_id: null }
      ];
      const incidents = steppingOnCartons.detect(trackSeries, allTracks, config, videoId);
      expect(incidents).toHaveLength(0);
    });
  });

  describe('scoreCalculator.js', () => {
    it('should merge two incidents on same track with overlapping frames and escalate risk', () => {
      const incidents = [
        { video_id: 'v1', track_id: 1, behaviour: 'dropped', frame_start: 10, frame_end: 20, timestamp_end_sec: 2, risk_level: 'High', evidence: { a: 1 } },
        { video_id: 'v1', track_id: 1, behaviour: 'roughHandling', frame_start: 15, frame_end: 25, timestamp_end_sec: 2.5, risk_level: 'Critical', evidence: { b: 2 } }
      ];
      const merged = scoreCalculator.mergeAndScore(incidents);
      expect(merged).toHaveLength(1);
      expect(merged[0].behaviour).toContain('dropped+roughHandling');
      expect(merged[0].risk_level).toBe('Critical');
      expect(merged[0].frame_start).toBe(10);
      expect(merged[0].frame_end).toBe(25);
    });

    it('should NOT merge two incidents on different tracks', () => {
      const incidents = [
        { video_id: 'v1', track_id: 1, behaviour: 'dropped', frame_start: 10, frame_end: 20, risk_level: 'High', evidence: {} },
        { video_id: 'v1', track_id: 2, behaviour: 'roughHandling', frame_start: 10, frame_end: 20, risk_level: 'Critical', evidence: {} }
      ];
      const merged = scoreCalculator.mergeAndScore(incidents);
      expect(merged).toHaveLength(2);
    });
  });
});
