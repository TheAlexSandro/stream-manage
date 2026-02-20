import { Context } from "grammy";
import { btn } from "../Buttons/InlineButton";
import { t } from "../../Middlewares/i18n";
import type { Callback } from "../../types/type";
import { spawn } from "child_process";
import { Cache } from "../Caches/Cache";
import path from "path";

export class Helper {
  static getName(ctx: Context) {
    const chatId = ctx.chat?.id;
    const username = ctx.from?.username;
    const name = this.clearHTML(String(ctx.from?.first_name));

    return username
      ? `@${username}`
      : `<a href='tg://user?id=${chatId}'>${name}</a>`;
  }

  static clearHTML(s: string) {
    if (!s) return s;
    return s.replace(/</g, "").replace(/>/g, "");
  }

  static generateID(length: number): string {
    const characters =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const panjangKarakter = characters.length;
    let result = "";

    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * panjangKarakter));
    }

    return result;
  }

  static generateStreamConfig(
    status: "running" | "paused" | "none",
    streamId: string,
    started: boolean,
  ) {
    const keyb = [];
    if (started) {
      const isPaused = status === "paused";

      keyb.push([
        btn.text(
          t("en", isPaused ? "resume_button" : "pause_button"),
          `stream_${isPaused ? "resume" : "pause"}_${streamId}`,
        ),
      ]);

      keyb.push([
        btn.text(t("en", "stop_button"), `stream_stop_${streamId}`),
        btn.text(
          t("en", "force_stop_button"),
          `stream_forceStop_${streamId}`,
          "danger",
        ),
      ]);
    } else {
      keyb.push([
        btn.text(
          t("en", "start_button"),
          `stream_start_${streamId}`,
          "success",
        ),
      ]);
      keyb.push([
        btn.text(
          t("en", "cancel_stream_button"),
          `stream_cancel_${streamId}`,
          "danger",
        ),
      ]);
    }

    const settingsRows = [
      ["tune_button", "stream_tune", "preset_button", "stream_preset"],
      ["stream_loop_button", "stream_loop", "fps_button", "stream_fps"],
      [
        "bitratev_button",
        "stream_bitratev",
        "bitratea_button",
        "stream_bitratea",
      ],
      ["maxrate_button", "stream_maxrate", "bufsize_button", "stream_bufsize"],
      ["codec_button", "stream_videoCodec"],
      ["audiocodec_button", "stream_audioCodec"],
      ["samplerate_button", "stream_sample"],
      ["speed_buton", "stream_speed"],
    ];

    for (const row of settingsRows) {
      const buttons = [];
      for (let i = 0; i < row.length; i += 2) {
        const label = t("en", row[i] as any);
        const callbackData = `${row[i + 1]}_${streamId}`;

        buttons.push(btn.text(label, callbackData));
      }
      keyb.push(buttons);
    }

    return keyb;
  }

  static parseFFmpegLog(log: string) {
    const json: any = {};
    const regex = /(\w+)=\s*([\d\w\.:\/-]+)/g;
    let match;

    while ((match = regex.exec(log)) !== null) {
      let key = match[1];
      let value: any = match[2];
      if (!isNaN(value) && !value.includes(":")) {
        value = parseFloat(value);
      }

      json[key] = value;
    }

    return json;
  }

  static isLive(url: string, callback: Callback<boolean | null>) {
    const proc = spawn("yt-dlp", [
      "--print",
      "is_live",
      "--no-warnings",
      "--cokies",
      path.join(process.cwd(), "cookies.txt"),
      url,
    ]);
    proc.stdout.on("data", (d) => {
      return callback(null, d.toString().trim() === "True");
    });

    proc.stderr.on("data", (e) => {
      return callback(e.toString(), null);
    });
  }

  static checkOpt(streamId: string) {
    const sourceId = String(Cache.get(`used_source_${streamId}`)).split("|")[2];
    const isYtLive = Cache.get(`is_live_yt_${sourceId}_${streamId}`);

    return isYtLive ? true : false;
  }

  static permsYt(streamId: string) {
    const sourceId = String(Cache.get(`used_source_${streamId}`)).split("|")[2];
    const ytPerm = Cache.get(`yt_denied_${sourceId}_${streamId}`);

    if (ytPerm) {
      return String(ytPerm).split(",");
    } else {
      return [];
    }
  }

  private static urlYT(url: string) {
    return /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i.test(
      url,
    );
  }

  static isYT(url: string | null, streamId?: string) {
    let yt;
    if (streamId) {
      const source = String(Cache.get(`used_source_${streamId}`)).split("|");
      yt = this.urlYT(source[1]);
    } else {
      yt = this.urlYT(String(url));
    }
    return yt;
  }
}
