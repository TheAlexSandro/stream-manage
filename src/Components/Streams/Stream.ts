import ffmpegPath from "ffmpeg-static";
import { Cache } from "../Caches/Cache";
import { spawn, ChildProcess } from "node:child_process";
import { Bot } from "grammy";
import type { Callback, FFmpegConfig } from "../../types/type";
import { t } from "../../Middlewares/i18n";
import { Helper } from "../Helper/Helper";
import path from "node:path";
import { btn, markup } from "../Buttons/InlineButton";
import { StreamHelper } from "./StreamHelper";

export class Streams {
  static getSource(
    source: string | null | undefined,
    bot: Bot | null | undefined,
    isYT: boolean | null | undefined,
    chatId: string,
    messageId: number,
    streamId: string,
    callback: Callback<string | ChildProcess | null>,
  ) {
    const isUrl =
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/i.test(
        String(source),
      );

    if (isYT) {
      bot?.api
        .editMessageText(
          String(chatId),
          Number(messageId),
          t("en", "starting_ytconf_message", {
            status_f: Cache.get(`config_ffmpeg_${streamId}`) ? `✅` : ``,
            status_s: ``,
            status_r: ``,
          }),
          { parse_mode: "HTML" },
        )
        .catch(() => {});
      const controller = Cache.get<AbortController>(`controller_${streamId}`);
      const { signal } = controller!;
      const usedSource = String(Cache.get(`used_source_${streamId}`)).split(
        "|",
      );
      const isContinue = Cache.get(`start_last_${usedSource[2]}_${streamId}`);
      const lastSavedSec = String(
        Cache.get(`stream_position_${usedSource[2]}_${streamId}`) || 0,
      );

      const args = [];

      if (isContinue) {
        args.push("--ss", lastSavedSec);
      }

      args.push(
        "-f",
        "bv*+ba/b",
        "--js-runtime",
        "node",
        "--cookies",
        path.join(process.cwd(), "cookies.txt"),
        "--no-part",
        "--no-playlist",
        "-o",
        "-",
        String(source),
      );

      const proc = spawn("yt-dlp", args, { signal });

      setTimeout(() => {
        return callback(null, proc as ChildProcess);
      }, 2000);
    } else if (isUrl) {
      return callback(null, source as string);
    } else {
      bot?.api
        .getFile(String(source))
        .then((result) => {
          let source = `https://api.telegram.org/file/bot${process.env["BOT_TOKEN"]}/${result.file_path}`;

          return callback(null, source);
        })
        .catch((err) => {
          return callback(null, source as string);
        });
    }
  }

  static generateFFmpegArgs(config: FFmpegConfig): string[] {
    const {
      source,
      streamKey,
      streamLoop,
      fps,
      videoCodec,
      preset,
      bitrateV,
      customMaxRate,
      customBufSize,
      tune,
      audioCodec,
      bitrateA,
      sampleRate,
      playbackSpeed = 1,
      watermarkImage,
      watermarkText,
      startTime,
      isYT,
      streamId,
    } = config;

    const bitrateStr = `${bitrateV}k`;
    const maxRate = customMaxRate ? `${customMaxRate}k` : bitrateStr;
    const bufSize = customBufSize ? `${customBufSize}k` : bitrateStr;
    const gopValue = config.customGOP ?? fps * 2;

    const isImage = /\.(jpg|jpeg|png)$/i.test(source);

    let filters = [`scale=-2:720`];
    if (playbackSpeed !== 1) {
      filters.push(`setpts=${(1 / playbackSpeed).toFixed(6)}*PTS`);
    }

    if (watermarkText) {
      const fontPath = path
        .join(process.cwd(), "Assets", "roboto.ttf")
        .replace(/\\/g, "/")
        .replace(/:/g, "\\:");
      filters.push(
        `drawtext=text='${watermarkText}':x=20:y=H-th-20:fontfile='${fontPath}':fontsize=30:fontcolor=white:box=1:boxcolor=black@0.4`,
      );
    }

    const args = [
      "-re",
      "-protocol_whitelist",
      "file,http,https,tcp,tls,crypto,pipe",
    ];

    if (isImage) {
      args.push(
        "-fflags",
        "nobuffer",
        "-flags",
        "low_delay",
        "-framerate",
        fps.toString(),
        "-loop",
        "1",
      );
    } else {
      if (!isYT) {
        args.push(
          "-reconnect",
          "1",
          "-reconnect_at_eof",
          "1",
          "-reconnect_streamed",
          "1",
          "-reconnect_delay_max",
          "5",
        );
        if (startTime && startTime > 0) {
          args.push("-ss", startTime.toString());
        }
        args.push("-stream_loop", streamLoop.toString());
      }
    }

    if (!isYT) {
      args.push("-i", source);
    } else {
      args.push("-i", "pipe:0");
    }

    if (isImage) {
      args.push(
        "-f",
        "lavfi",
        "-i",
        "anullsrc=channel_layout=stereo:sample_rate=44100",
      );
    }

    if (watermarkImage) {
      args.push("-i", watermarkImage);
      const filterComplex =
        `[0:v]${filters.join(",")}[bg];` +
        `[1:v]scale=150:-1[logo];` +
        `[bg][logo]overlay=W-w-20:20[outv]`;

      args.push("-filter_complex", filterComplex, "-map", "[outv]");
    } else {
      args.push("-vf", `${filters.join(",")},format=yuv420p`);
      if (!isYT) {
        args.push("-map", "0:v:0");
      }
    }

    if (isImage) {
      args.push("-map", "1:a:0");
    } else if (!isImage && !isYT) {
      args.push("-map", "0:a?");
    }

    args.push(
      "-r",
      fps.toString(),
      "-c:v",
      videoCodec,
      "-preset",
      preset,
      "-b:v",
      bitrateStr,
      "-maxrate",
      maxRate,
      "-minrate",
      bitrateStr,
      "-bufsize",
      bufSize,
      "-pix_fmt",
      "yuv420p",
      "-g",
      gopValue.toString(),
      "-keyint_min",
      gopValue.toString(),
      "-sc_threshold",
      "0",
      "-tune",
      isImage ? "stillimage" : tune,
      "-c:a",
      audioCodec,
      "-b:a",
      bitrateA,
      "-ar",
      sampleRate.toString(),
    );

    let afParts = [];
    if (playbackSpeed && playbackSpeed !== 1) {
      let remainingSpeed = playbackSpeed;

      if (remainingSpeed < 0.5) {
        remainingSpeed = 0.5;
      }
      while (remainingSpeed > 2.0) {
        afParts.push("atempo=2.0");
        remainingSpeed /= 2.0;
      }
      while (remainingSpeed < 0.5) {
        afParts.push("atempo=0.5");
        remainingSpeed *= 2.0;
      }

      afParts.push(`atempo=${remainingSpeed.toFixed(2)}`);
    }

    if (afParts.length > 0) {
      args.push("-af", afParts.join(","));
    }

    args.push("-f", "flv", streamKey);
    return args;
  }

  static start(
    streamId: string,
    chatId: string | null,
    streamKey: string | null,
    used_source: string | null,
    bot: Bot | null,
    message_id: number | null,
    fromPause: boolean,
    isPaused?: boolean,
    sourceId?: string,
  ) {
    Cache.set(`starting_${streamId}`, true);
    const isYT = Helper.isYT(String(used_source));
    bot?.api
      .editMessageText(
        String(chatId),
        Number(message_id),
        t("en", isYT ? "starting_ytconf_message" : "starting_conf_message", {
          status_f: ``,
          status_s: ``,
          status_r: ``,
        }),
        { parse_mode: "HTML" },
      )
      .catch(() => {});
    Cache.set(`config_ffmpeg_${streamId}`, true);

    Cache.set(`blocks_${streamId}`, true);
    Cache.del(`conf_change_${streamId}`);

    const controller = new AbortController();
    const { signal } = controller;
    Cache.set<AbortController>(`controller_${streamId}`, controller);

    this.getSource(
      used_source,
      bot,
      isYT,
      String(chatId),
      Number(message_id),
      String(streamId),
      (error, source) => {
        let myConfig: FFmpegConfig;
        if (!fromPause) {
          myConfig = {
            source: String(source),
            streamKey: String(streamKey).replace("|", ""),
            streamLoop: Helper.permsYt(streamId).includes("loop")
              ? 0
              : Number(Cache.get(`stream_loop_${streamId}`) ?? 0),
            fps: Number(Cache.get(`stream_fps_${streamId}`) ?? 30) as 30 | 60,
            videoCodec: String(
              Cache.get(`stream_video_codec_${streamId}`) ?? "libx264",
            ) as "libx264" | "libx265" | "libsvtav1",
            preset: String(
              Cache.get(`stream_preset_${streamId}`) ?? "ultrafast",
            ) as
              | "ultrafast"
              | "superfast"
              | "veryfast"
              | "faster"
              | "fast"
              | "medium"
              | "slow",
            bitrateV: Number(Cache.get(`stream_bitratev_${streamId}`) ?? 2500),
            customMaxRate: Number(
              Cache.get(`stream_maxrate_${streamId}`) ?? 2500,
            ),
            customBufSize: Number(
              Cache.get(`stream_bufsize_${streamId}`) ?? 2500,
            ),
            tune: String(
              Cache.get(`stream_tune_${streamId}`) ?? "zerolatency",
            ) as
              | "zerolatency"
              | "film"
              | "animation"
              | "grain"
              | "stillimage"
              | "fastdecode",
            audioCodec: String(Cache.get(`stream_audio_codec`) ?? "aac") as
              | "aac"
              | "libmp3lame"
              | "libopus"
              | "libvorbis"
              | "ac3"
              | "pcm_s16le",
            bitrateA: String(
              Cache.get(`stream_bitratea_${streamId}`) ?? "128k",
            ) as "96k" | "128k",
            sampleRate: Number(
              Cache.get(`stream_sample_rate_${streamId}`) ?? 48000,
            ) as 44100 | 48000,
            playbackSpeed: Helper.permsYt(streamId).includes("speed")
              ? 0
              : Number(Cache.get(`stream_playback_speed_${streamId}`) ?? 1),
            watermarkText: String(
              Cache.get(`stream_textwm_${streamId}`) ??
                `streaming with @${process.env["BOT_USERNAME"]}`,
            ),
            isYT,
            streamId,
          };
        } else {
          const getConfig = Cache.get<FFmpegConfig>(
            `stream_config_${streamId}`,
          );
          const lastPos =
            Cache.get<number>(`stream_position_${sourceId}_${streamId}`) || 0;

          myConfig = {
            ...getConfig!,
            ...(!isPaused && !isYT && { startTime: lastPos }),
            source: String(source),
            isYT,
            streamId,
          };
        }

        Cache.set(`config_down_${streamId}`, true);
        bot?.api
          .editMessageText(
            String(chatId),
            Number(message_id),
            t(
              "en",
              isYT ? "starting_ytconf_message" : "starting_conf_message",
              {
                status_f: Cache.get(`config_ffmpeg_${streamId}`) ? `✅` : ``,
                status_s: Cache.get(`config_down_${streamId}`) ? `✅` : ``,
                status_r: ``,
              },
            ),
            { parse_mode: "HTML" },
          )
          .catch(() => {});

        Cache.set(`controller_${streamId}`, controller);
        const ffmpegArgs = this.generateFFmpegArgs(myConfig);
        const ffmpeg = spawn(String(ffmpegPath), ffmpegArgs, { signal });

        ffmpeg.on("error", (err: any) => {
          if (err.code === "ABORT_ERR" || err.name === "AbortError") return;
          if (Cache.get(`silent_${streamId}`)) return;
          if (Cache.get(`stops_${streamId}`)) {
            StreamHelper.closeStream(
              streamId,
              bot,
              String(chatId),
              Number(message_id),
            );
            return;
          } else {
            bot?.api
              .deleteMessage(String(chatId), Number(message_id))
              .catch(() => {});
            bot?.api
              .sendMessage(
                String(chatId),
                t("en", "fatal_stream_error_message"),
                {
                  parse_mode: "HTML",
                },
              )
              .catch(() => {});
            StreamHelper.removeProperty(streamId);
          }
        });

        if (source instanceof ChildProcess) {
          ffmpeg.stdin.on("error", () => {
            if (Cache.get(`silent_${streamId}`)) return;
            StreamHelper.closeStream(
              streamId,
              bot,
              String(chatId),
              Number(message_id),
            );
          });

          source.on("error", () => {
            if (Cache.get(`silent_${streamId}`)) return;
            StreamHelper.closeStream(
              streamId,
              bot,
              String(chatId),
              Number(message_id),
            );
          });

          source?.stdout?.pipe(ffmpeg.stdin);
          Cache.set(`source_st_${streamId}`, source);
        }

        Cache.set(`stream_${streamId}`, ffmpeg);
        const ts = setTimeout(() => {
          var keyb = [];
          keyb = [
            btn.text(
              t("en", "abort_stream_buton"),
              `abort_soft_${streamId}`,
              "danger",
            ),
          ];
          bot?.api
            .sendMessage(String(chatId), t("en", "stream_long_message"), {
              parse_mode: "HTML",
              reply_markup: markup.inlineKeyboard(keyb),
            })
            .then((message_result) => {
              Cache.set(`abort_msg_id_${streamId}`, message_result.message_id);
            })
            .catch(() => {});
        }, 20000);
        Cache.set(`timeout_infos_${streamId}`, ts);

        if (!fromPause) {
          Cache.set(`stream_config_${streamId}`, myConfig);
          Cache.set(`stream_source_${streamId}`, source);
        }

        const lastSavedSec = Number(
          Cache.get(`stream_position_${sourceId}_${streamId}`) || 0,
        );

        ffmpeg.stderr.on("data", (d) => {
          const data = String(d);
          const m = /time=(\d+):(\d+):(\d+\.\d+)/.exec(data);

          if (!Cache.get(`stream_${streamId}`)) return;
          if (m) {
            const currentSec =
              Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
            const absoluteSec = lastSavedSec + currentSec;
            Cache.set(`stream_position_${sourceId}_${streamId}`, absoluteSec);
          }

          console.log(data);
          const fatalErrors = [
            "Connection reset by peer",
            "Broken pipe",
            "Invalid argument",
            "No route to host",
            "Immediate exit requested",
            "Server returned 4xx",
            "Authentication failed",
            "Forbidden",
          ];
          const isFatal = fatalErrors.some((errMsg) => data.includes(errMsg));

          if (isFatal) {
            clearTimeout(
              Cache.get<NodeJS.Timeout>(`timeout_infos_${streamId}`),
            );
            Cache.del(`stream_${streamId}`);
            ffmpeg.kill("SIGKILL");
            var keyb: any[] = [];
            keyb = [
              btn.text(t("en", "settings_button"), `stream_return_${streamId}`),
            ];
            StreamHelper.removeProperty(streamId);
            return bot?.api
              .editMessageText(
                String(chatId),
                Number(message_id),
                t("en", "fatal_stream_error_message"),
                {
                  parse_mode: "HTML",
                  link_preview_options: { is_disabled: true },
                  reply_markup: markup.inlineKeyboard(keyb),
                },
              )
              .catch(() => {
                bot?.api
                  .sendMessage(
                    String(chatId),
                    t("en", "fatal_stream_error_message"),
                    {
                      parse_mode: "HTML",
                      link_preview_options: { is_disabled: true },
                      reply_markup: markup.inlineKeyboard(keyb),
                    },
                  )
                  .catch(() => {});
              });
          }

          const errorPatterns = [
            /(?:HTTP error|Server returned) (\d+|4XX) (.*)/i,
            /Failed to resolve hostname (.*)/i,
            /Error opening input: (.*)/i,
            /Error opening output files: (.+)/i,
            /(Option .+) (not found)/i,
          ];

          let detectedError = null;
          for (const pattern of errorPatterns) {
            const match = pattern.exec(data);
            if (match) {
              detectedError =
                match[1] && match[2]
                  ? `${match[1]} ${match[2]}`
                  : match[1] || "I/O Error";
              break;
            }
          }

          if (detectedError && !Cache.get(`has_sent_error_${chatId}`)) {
            clearTimeout(
              Cache.get<NodeJS.Timeout>(`timeout_infos_${streamId}`),
            );
            Cache.set(`has_sent_error_${chatId}`, true);
            Cache.del(`blocks_${streamId}`);
            if (Cache.get(`timeout_infos_${streamId}`)) {
              clearTimeout(
                Cache.get<NodeJS.Timeout>(`timeout_infos_${streamId}`),
              );
              Cache.del(`timeout_infos_${streamId}`);
            }

            setTimeout(() => {
              Cache.del(`has_sent_error_${chatId}`);
            }, 5000);

            if (data.includes("frame=")) {
              bot?.api
                .sendMessage(
                  String(chatId),
                  t("en", "on_stream_error_message"),
                  {
                    parse_mode: "HTML",
                  },
                )
                .then((result_message) => {
                  bot?.api
                    .deleteMessage(
                      String(chatId),
                      Number(result_message.message_id),
                    )
                    .catch(() => {});
                })
                .catch(() => {});
              return;
            }

            ffmpeg.kill("SIGKILL");
            Cache.del(`stream_${streamId}`);

            Cache.set(`blocks_${streamId}`, true);
            StreamHelper.removeProperty(streamId);
            bot?.api
              .editMessageText(
                String(chatId),
                Number(message_id),
                t("en", "stream_error_with_reason_message", {
                  error: detectedError.trim(),
                }),
                { parse_mode: "HTML" },
              )
              .catch(() => {});
            return;
          }

          if (data.includes("frame=")) {
            if (Cache.get(`blocks_${streamId}`)) {
              Cache.del(`blocks_${streamId}`);
            }

            if (Cache.get(`timeout_infos_${streamId}`)) {
              clearTimeout(
                Cache.get<NodeJS.Timeout>(`timeout_infos_${streamId}`),
              );
              Cache.del(`timeout_infos_${streamId}`);
            }
          }

          if (
            data.includes("frame=") &&
            !Cache.get(`has_sent_conf_${streamId}`)
          ) {
            if (Cache.get(`abort_msg_id_${streamId}`)) {
              bot?.api
                .deleteMessage(
                  String(chatId),
                  Number(Cache.get(`abort_msg_id_${streamId}`)),
                )
                .catch(() => {});
              Cache.del(`abort_msg_id_${streamId}`);
            }
            const ffmpegLog = Helper.parseFFmpegLog(data);
            const spd = ffmpegLog["speed"];
            const bitr = ffmpegLog["bitrate"];
            if (bitr !== "N/A") {
              Cache.set(`has_sent_conf_${streamId}`, true);
            }
            if (!Cache.get(`inits_${streamId}`)) {
              Cache.set(`inits_${streamId}`, true);
              Cache.del(`starting_${streamId}`);
              Cache.set(`started_${streamId}`, true);
            }

            if (Cache.get(`silent_${streamId}`)) {
              const type = String(Cache.get(`silent_${streamId}`));

              if (type === "changed") {
                Cache.del(`start_last_${sourceId}_${streamId}`);
                Cache.del(`silent_${streamId}`);
                bot?.api
                  .deleteMessage(
                    String(chatId),
                    Number(Cache.get(`ch_message_id_${streamId}`)),
                  )
                  .catch(() => {});
                Cache.del(`ch_message_id_${streamId}`);
                bot?.api
                  .sendMessage(
                    String(chatId),
                    t("en", "change_source_succ_message"),
                    { parse_mode: "HTML" },
                  )
                  .then((result_message) => {
                    setTimeout(() => {
                      bot?.api
                        .deleteMessage(
                          String(chatId),
                          Number(result_message.message_id),
                        )
                        .catch(() => {});
                    }, 1000);
                  })
                  .catch(() => {});
              }
            }

            const keyb = Helper.generateStreamConfig(
              Cache.get(`paused_${streamId}`) ? "paused" : "running",
              streamId,
              true,
            );
            const mediaSource = String(
              Cache.get(`used_source_${streamId}`),
            ).split("|");
            bot?.api
              .editMessageText(
                String(chatId),
                Number(message_id),
                t("en", "started_message", {
                  id: streamId,
                  frame: ffmpegLog["frame"],
                  fps: ffmpegLog["fps"],
                  qscale: ffmpegLog["q"],
                  size: ffmpegLog["size"],
                  time: ffmpegLog["time"],
                  bitrate: bitr,
                  dup: ffmpegLog["dup"] ?? `0`,
                  drop: ffmpegLog["drop"] ?? `0`,
                  speed: parseFloat(spd) < 0.7 ? `${spd} ⚠️` : spd,
                  source: mediaSource[0],
                }),
                {
                  parse_mode: "HTML",
                  reply_markup: markup.inlineKeyboard(keyb),
                },
              )
              .catch(() => {});

            if (bitr !== "N/A") {
              const ts = setTimeout(() => {
                if (Cache.get(`in_settings_${streamId}`)) return;
                Cache.del(`has_sent_conf_${streamId}`);
              }, 10000);
              Cache.set(`timeout_conf_${streamId}`, ts);
            }
          }
        });

        signal.onabort = () => {
          if (Cache.get(`silent_${streamId}`)) return;
          StreamHelper.closeStream(
            streamId,
            bot,
            String(chatId),
            Number(message_id),
          );
        };

        ffmpeg.on("close", (code) => {
          if (Cache.get(`starting_${streamId}`)) return;
          if (!Cache.get(`stream_${streamId}`)) return;
          if (Cache.get(`silent_${streamId}`)) {
            const type = String(Cache.get(`silent_${streamId}`));

            if (type === "changed") {
              bot?.api
                .deleteMessage(String(chatId), Number(message_id))
                .catch(() => {});
              bot?.api
                .sendMessage(String(chatId), t("en", "starting_message"), {
                  parse_mode: "HTML",
                })
                .then((message_result) => {
                  Cache.del(`has_sent_conf_${streamId}`);
                  const source = String(
                    Cache.get(`used_source_${streamId}`),
                  ).split("|");

                  this.start(
                    streamId,
                    String(chatId),
                    streamKey,
                    source[1],
                    bot,
                    message_result?.message_id,
                    true,
                    Cache.get(`start_last_${source[2]}_${streamId}`)
                      ? false
                      : true,
                    source[2],
                  );
                })
                .catch(() => {});
              return;
            }

            if (type === "restart") {
              Cache.del(`silent_${streamId}`);
              Cache.del(`has_sent_conf_${streamId}`);
              const mediaSource = String(
                Cache.get(`used_source_${streamId}`),
              ).split("|");

              Cache.set(`start_last_${mediaSource[2]}_${streamId}`, true);
              bot?.api
                .deleteMessage(String(chatId), Number(message_id))
                .catch(() => {});
              this.start(
                streamId,
                String(chatId),
                streamKey,
                mediaSource[1],
                bot,
                Number(Cache.get(`restart_msg_id_${streamId}`)),
                true,
                false,
                mediaSource[2],
              );
              return;
            }
          } else if (Cache.get(`stops_${streamId}`)) {
            if (Cache.get(`has_sent_stops_${streamId}`)) {
              Cache.del(`has_sent_stops_${streamId}`);
              Cache.del(`stops_${streamId}`);
              StreamHelper.removeProperty(streamId);
            } else {
              StreamHelper.closeStream(
                streamId,
                bot,
                String(chatId),
                Number(message_id),
              );
            }
            return;
          } else {
            if (code === 0) {
              bot?.api
                .sendMessage(String(chatId), t("en", "stream_done_message"), {
                  parse_mode: "HTML",
                })
                .catch(() => {});
            } else {
              bot?.api
                .sendMessage(
                  String(chatId),
                  t("en", "stream_done_err_message"),
                  {
                    parse_mode: "HTML",
                  },
                )
                .catch(() => {});
            }
            Cache.del(`stream_position_${sourceId}_${streamId}`);
            bot?.api
              .deleteMessage(String(chatId), Number(message_id))
              .catch(() => {});
            StreamHelper.removeProperty(streamId);
          }
        });

        return true;
      },
    );
  }

  static changeSource(streamId: string) {
    const getStream = Cache.get<ChildProcess>(`stream_${streamId}`);
    if (!getStream) return false;
    Cache.set(`silent_${streamId}`, "changed");
    clearTimeout(Cache.get<NodeJS.Timeout>(`timeout_conf_${streamId}`));
    if (Helper.isYT(null, streamId)) {
      const source = Cache.get<ChildProcess>(`source_st_${streamId}`);
      const controller = Cache.get<AbortController>(`controller_${streamId}`);
      try {
        if (getStream.stdin) {
          source?.stdout?.unpipe(getStream.stdin);
        }
        source?.stdout?.destroy();
        controller!.abort();
      } catch {}
      getStream.stdin?.write("q");
    } else {
      getStream.stdin?.write("q");
    }
    return;
  }

  static restart(streamId: string) {
    const getStream = Cache.get<ChildProcess>(`stream_${streamId}`);
    if (!getStream) return false;
    Cache.set(`silent_${streamId}`, "restart");
    clearTimeout(Cache.get<NodeJS.Timeout>(`timeout_conf_${streamId}`));
    if (Helper.isYT(null, streamId)) {
      const source = Cache.get<ChildProcess>(`source_st_${streamId}`);
      const controller = Cache.get<AbortController>(`controller_${streamId}`);
      try {
        if (getStream.stdin) {
          source?.stdout?.unpipe(getStream.stdin);
        }
        source?.stdout?.destroy();
        controller!.abort();
      } catch {}
      getStream.stdin?.write("q");
    } else {
      getStream.stdin?.write("q");
    }
    Cache.del(`has_sent_conf_${streamId}`);
    return;
  }

  static pause(streamId: string) {
    const getStream = Cache.get<ChildProcess>(`stream_${streamId}`);
    if (!getStream) return false;
    if (Cache.get(`paused_${streamId}`)) return "paused";
    Cache.set(`paused_${streamId}`, true);
    Cache.set(`silent_${streamId}`, "paused");
    clearTimeout(Cache.get<NodeJS.Timeout>(`timeout_conf_${streamId}`));
    if (Helper.isYT(null, streamId)) {
      const source = Cache.get<ChildProcess>(`source_st_${streamId}`);
      const controller = Cache.get<AbortController>(`controller_${streamId}`);
      try {
        if (getStream.stdin) {
          source?.stdout?.unpipe(getStream.stdin);
        }
        source?.stdout?.destroy();
        controller!.abort();
      } catch {}
      getStream.stdin?.write("q");
    } else {
      getStream.stdin?.write("q");
    }
    return;
  }

  static resume(
    streamId: string,
    chatId: string,
    bot: Bot,
    message_id: number,
  ) {
    const getStream = Cache.get<ChildProcess>(`stream_${streamId}`);
    if (!getStream) return false;
    if (!Cache.get(`paused_${streamId}`)) return "not_paused";
    Cache.del(`paused_${streamId}`);
    Cache.del(`silent_${streamId}`);
    Cache.del(`has_sent_conf_${streamId}`);
    const source = String(Cache.get(`used_source_${streamId}`)).split("|");

    this.start(
      streamId,
      chatId,
      String(Cache.get(`stream_key_${streamId}`)),
      source[1],
      bot,
      message_id,
      true,
      false,
      source[2],
    );
    return;
  }

  static stop(streamId: string) {
    const getStream = Cache.get<ChildProcess>(`stream_${streamId}`);
    if (!getStream) return false;
    clearTimeout(Cache.get<NodeJS.Timeout>(`timeout_conf_${streamId}`));
    Cache.set(`stops_${streamId}`, "stop");
    if (Helper.isYT(null, streamId)) {
      const controller = Cache.get<AbortController>(`controller_${streamId}`);
      const source = Cache.get<ChildProcess>(`source_st_${streamId}`);
      try {
        if (getStream.stdin) {
          source?.stdout?.unpipe(getStream.stdin);
        }
        source?.stdout?.destroy();
        controller!.abort();
      } catch {}
      getStream.stdin?.write("q");
    } else {
      getStream.stdin?.write("q");
    }
    return true;
  }

  static forceStop(streamId: string) {
    const getStream = Cache.get<ChildProcess>(`stream_${streamId}`);
    if (!getStream) return false;
    clearTimeout(Cache.get<NodeJS.Timeout>(`timeout_conf_${streamId}`));
    Cache.set(`stops_${streamId}`, "force_stop");
    if (Helper.isYT(null, streamId)) {
      const controller = Cache.get<AbortController>(`controller_${streamId}`);
      const source = Cache.get<ChildProcess>(`source_st_${streamId}`);
      try {
        if (getStream.stdin) {
          source?.stdout?.unpipe(getStream.stdin);
        }
        source?.stdout?.destroy();
        controller!.abort();
      } catch {}
    }
    getStream.kill("SIGKILL");
    return true;
  }

  static abortStream(streamId: string) {
    const getStream = Cache.get<ChildProcess>(`stream_${streamId}`);
    if (!getStream) return false;
    Cache.set(`stops_${streamId}`, "aborted");
    const controller = Cache.get<AbortController>(`controller_${streamId}`);
    const source = Cache.get<ChildProcess>(`source_st_${streamId}`);

    try {
      if (getStream.stdin) {
        source?.stdout?.unpipe(getStream.stdin);
      }
      source?.stdout?.destroy();
      controller!.abort();
    } catch {}
    getStream.stdin?.write("q");
    getStream.kill("SIGKILL");
  }
}
