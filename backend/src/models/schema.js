const { z } = require('zod');

const ObjectSchema = z.object({
  track_id: z.number(),
  class: z.string(),
  bbox_xyxy: z.array(z.number()).length(4),
  center: z.array(z.number()).length(2).optional().nullable(),
  height_px: z.number().optional().nullable(),
  aspect_ratio: z.number().optional().nullable(),
  velocity_px_s: z.array(z.number()).length(2).optional().nullable(),
  confidence: z.number().optional().nullable(),
  in_zone: z.string().optional().nullable(),
  stacked_on_track_id: z.number().optional().nullable(),
  relative_size_vs_stacked: z.number().optional().nullable(),
  near_person_track_ids: z.array(z.number()).optional().nullable(),
  dwell_time_sec: z.number().optional().nullable(),
  foot_point: z.array(z.number()).length(2).optional().nullable(),
  foot_overlap_track_id: z.number().optional().nullable()
});

const FrameEventSchema = z.object({
  schema_version: z.string().optional(),
  video_id: z.string(),
  frame: z.number(),
  timestamp_sec: z.number(),
  objects: z.array(ObjectSchema)
});

const IncidentSchema = z.object({
  incident_id: z.string(),
  video_id: z.string(),
  behaviour: z.string(),
  track_id: z.number(),
  frame_start: z.number(),
  frame_end: z.number(),
  timestamp_start_sec: z.number(),
  timestamp_end_sec: z.number(),
  risk_level: z.enum(['Low', 'Medium', 'High', 'Critical']),
  confidence: z.number().optional(),
  evidence: z.any().optional(),
  reviewed: z.number().optional().default(0),
  created_at: z.string().optional()
});

const QuerySchema = z.object({
  video_id: z.string().optional(),
  risk: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  behaviour: z.string().optional(),
  from: z.coerce.number().optional(),
  to: z.coerce.number().optional(),
  limit: z.coerce.number().optional().default(100),
  offset: z.coerce.number().optional().default(0)
});

module.exports = {
  ObjectSchema,
  FrameEventSchema,
  IncidentSchema,
  QuerySchema
};
