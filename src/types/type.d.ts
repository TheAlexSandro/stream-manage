export type UserDB = {
  id: string;
  stream_list: string | null;
  is_premium: boolean | null;
  stream_loop: string | null;
  stream_fps: string | null;
  stream_video_codec: string | null;
  stream_preset: string | null;
  stream_bitratev: string | null;
  stream_bitratea: string | null;
  stream_maxrate: string | null;
  stream_bufsize: string | null;
  stream_tune: string | null;
  stream_audio_codec: string | null;
  stream_sample_rate: string | null;
  stream_playback_speed: string | null;
  stream_pause_thumbnail: string | null;
  stream_ended_thumbnail: string | null;
  stream_logo: string | null;
  stream_textwn: string | null;
};

export type VideoCodec = "libx264" | "libx265" | "libsvtav1";
export type AudioCodec =
  | "aac"
  | "libmp3lame"
  | "libopus"
  | "libvorbis"
  | "ac3"
  | "pcm_s16le";
export type TuneOption =
  | "zerolatency"
  | "film"
  | "animation"
  | "grain"
  | "stillimage"
  | "fastdecode";
export type PresetOption =
  | "ultrafast"
  | "superfast"
  | "veryfast"
  | "faster"
  | "fast"
  | "medium"
  | "slow";
export type BitrateA = "96k" | "128k";

export interface FFmpegConfig {
  source: string;
  streamKey: string;
  streamLoop: number;
  fps: 30 | 60;
  videoCodec: VideoCodec;
  preset: PresetOption;
  bitrateV: number;
  customMaxRate?: number;
  customBufSize?: number;
  customGOP?: number;
  tune: TuneOption;
  audioCodec: AudioCodec;
  bitrateA: BitrateA;
  sampleRate: 44100 | 48000;
  playbackSpeed?: number;
  watermarkImage?: string;
  watermarkText?: string;
  startTime?: number;
  isYT?: boolean;
  streamId?: string;
}

export type Callback<T> = (error: null | string, result: T) => void;
