import { Context, Bot } from "grammy";
import { t } from "../Middlewares/i18n";
import { Helper } from "../Components/Helper/Helper";
import { Cache } from "../Components/Caches/Cache";
import { Database } from "../Components/Database/Database";
import type { UserDB } from "../types/type";
import { Streams } from "../Components/Streams/Stream";
import { btn, markup } from "../Components/Buttons/InlineButton";
import { StreamHelper } from "../Components/Streams/StreamHelper";

export class CallbackQuery {
  static handle(ctx: Context, bot: Bot) {
    const cb = ctx.callbackQuery;
    const cbData = String(cb?.data);
    const chatID = String(ctx.chat?.id);
    let match;

    if (/silent_$/i.exec(cbData)) return ctx.answerCallbackQuery();
    if (/delete_$/i.exec(cbData)) return ctx.deleteMessage().catch(() => {});

    if (/cancel_session$/i.exec(cbData)) {
      Cache.del(`session_name_layer_${chatID}`);
      Cache.del(`session_layer_${chatID}`);
      Cache.del(`session_play_${chatID}`);
      Cache.del(`session_add_${chatID}`);
      Cache.del(`session_key_${chatID}`);
      ctx.editMessageText(t("en", "cancelled_message"));
      return;
    }

    if ((match = /config_(.+)/i.exec(cbData))) {
      const act = match[1];

      let msg = "";
      let keyb: any[] = [];
      if (act === "return") {
        Cache.del(`session_add_${chatID}`);
        keyb = [btn.text(t("en", "change_stream_button"), `config_key`)];
        msg = "config_message";
      }

      if (act === "key") {
        keyb = [btn.text(t("en", "cancel_button"), `config_return`)];
        msg = "stream_message_url";
        Cache.set(`session_add_${chatID}`, true);
      }

      //@ts-ignore
      ctx.editMessageText(t("en", msg), {
        parse_mode: "HTML",
        reply_markup: markup.inlineKeyboard(keyb),
      });
      ctx.answerCallbackQuery();
      return;
    }

    if ((match = /abort_(.+)_(.+)/i.exec(cbData))) {
      const type = match[1];
      const streamId = match[2];
      const streamKey = Cache.get(`stream_key_${streamId}`);
      if (!streamKey) {
        ctx.answerCallbackQuery({
          text: t("en", "stream_key_not_found_message"),
          show_alert: true,
        });
        ctx.deleteMessage().catch(() => {});
        return;
      }

      Streams.stop(streamId);
      StreamHelper.removeProperty(streamId);
      if (type === "all") {
        StreamHelper.abort(streamId, chatID);
      }
      ctx.editMessageText(t("en", "abort_succ_message"), {
        parse_mode: "HTML",
      });
      return;
    }

    if ((match = /layer_(.+)_(.+)_(.+)/i.exec(cbData))) {
      const act = match[1];
      const index = Number(match[2]);
      const streamId = match[3];
      const streamKey = Cache.get(`stream_key_${streamId}`);
      if (!streamKey) {
        ctx.answerCallbackQuery({
          text: t("en", "stream_key_not_found_message"),
          show_alert: true,
        });
        ctx.deleteMessage().catch(() => {});
        return;
      }

      const getSource = Cache.get(`raw_source_${streamId}`);
      if (/(list|select|delete)/i.exec(act)) {
        const maxLayer = Number(process.env["MAX_LAYER"]);
        const isStarted = Cache.get(`stream_${streamId}`);

        if (!getSource) {
          return ctx.answerCallbackQuery({
            text: t("en", "source_empty_message"),
            show_alert: true,
          });
        }

        if (act === "select") {
          if (index === Number(Cache.get(`source_index_${streamId}`)))
            return ctx.answerCallbackQuery();

          if (isStarted && Cache.get(`blocks_${streamId}`))
            return ctx.answerCallbackQuery({
              text: t("en", "wait_act_message"),
              show_alert: true,
            });

          const layersForSelect = String(getSource).split("<>");
          const picked = layersForSelect[index];

          if (isStarted) {
            const spls = picked.split("|");
            const isYtLive = Cache.get(`is_live_yt_${spls[2]}_${streamId}`);
            if (
              Cache.get(`stream_position_${spls[2]}_${streamId}`) &&
              !isYtLive
            ) {
              var keybs: any[] = [];
              keybs[0] = [
                btn.text(
                  t("en", "start_begin_button"),
                  `layer_startBegin_${index}_${streamId}`,
                ),
              ];
              keybs[1] = [
                btn.text(
                  t("en", "start_continue_button"),
                  `layer_startLast_${index}_${streamId}`,
                ),
              ];
              keybs[2] = [
                btn.text(t("en", "return_button"), `layer_list_0_${streamId}`),
              ];

              ctx.editMessageText(t("en", "change_menu_message"), {
                parse_mode: "HTML",
                reply_markup: markup.inlineKeyboard(keybs),
              });
            } else {
              var keybs: any[] = [];
              keybs = [
                btn.text(
                  t("en", "yes_button"),
                  `layer_confirm_${index}_${streamId}`,
                  "success",
                ),
                btn.text(
                  t("en", "no_button"),
                  `layer_list_0_${streamId}`,
                  "danger",
                ),
              ];

              ctx.editMessageText(
                t("en", "change_confirm_message", {
                  source_1:
                    layersForSelect[
                      Number(Cache.get(`source_index_${streamId}`))
                    ].split("|")[0],
                  source_2: layersForSelect[index].split("|")[0],
                }),
                {
                  parse_mode: "HTML",
                  reply_markup: markup.inlineKeyboard(keybs),
                },
              );
            }
            return;
          } else {
            Cache.set(`source_index_${streamId}`, index);
            Cache.set(`used_source_${streamId}`, layersForSelect[index]);
          }
        }

        const layers = String(getSource).split("<>");
        if (act === "delete") {
          if (isStarted && Cache.get(`blocks_${streamId}`))
            return ctx.answerCallbackQuery({
              text: t("en", "wait_act_message"),
              show_alert: true,
            });

          if (
            isStarted &&
            Number(Cache.get(`source_index_${streamId}`)) === index
          )
            return ctx.answerCallbackQuery({
              text: t("en", "used_source_message"),
              show_alert: true,
            });

          layers.splice(index, 1);
          const newRawSource = layers.join("<>");
          Cache.set(`raw_source_${streamId}`, newRawSource);

          const currentIndex = Number(Cache.get(`source_index_${streamId}`));
          if (index === currentIndex) {
            Cache.set(`source_index_${streamId}`, 0);
            Cache.set(`used_source_${streamId}`, layers[0]);
          } else if (index < currentIndex) {
            Cache.set(`source_index_${streamId}`, currentIndex - 1);
          }

          if (!newRawSource) {
            Cache.del(`raw_source_${streamId}`);
            Cache.del(`source_index_${streamId}`);
            Cache.del(`used_source_${streamId}`);
          }
        }

        const currentIndex = Number(Cache.get(`source_index_${streamId}`));

        const keyb = layers.map((item, i) => {
          const [name] = item.split("|");
          return [
            btn.text(
              `${name} ${i === currentIndex ? "✅" : ""}`,
              `layer_select_${i}_${streamId}`,
            ),
            btn.text(`🗑`, `layer_delete_${i}_${streamId}`, "danger"),
          ];
        });

        if (layers.length < maxLayer) {
          keyb.push([
            btn.text(t("en", "add_button"), `layer_add_0_${streamId}`),
          ]);
        }

        return ctx.editMessageText(
          t("en", "layer_list_message", { max_layer: String(maxLayer) }),
          {
            parse_mode: "HTML",
            reply_markup: markup.inlineKeyboard(keyb),
          },
        );
      }

      if (/(startBegin|startLast)/i.exec(act)) {
        const getSource = Cache.get(`raw_source_${streamId}`);
        if (!getSource)
          return ctx.answerCallbackQuery({
            text: t("en", "source_empty_message"),
            show_alert: true,
          });

        const layersForSelect = String(getSource).split("<>");
        const sourceId = layersForSelect[index].split("|")[2];
        const isYtLive = Cache.get(`is_live_yt_${sourceId}_${streamId}`);
        if (isYtLive)
          return ctx.answerCallbackQuery({
            text: t("en", "opt_unv_yt_message"),
            show_alert: true,
          });

        var keybs: any[] = [];
        keybs = [
          btn.text(
            t("en", "yes_button"),
            `layer_confirm_${index}_${streamId}`,
            "success",
          ),
          btn.text(
            t("en", "no_button"),
            `layer_select_${index}_${streamId}`,
            "danger",
          ),
        ];

        if (act === "startLast") {
          Cache.set(`start_last_${sourceId}_${streamId}`, true);
        }

        ctx.editMessageText(
          t("en", "change_confirm_message", {
            source_1:
              layersForSelect[
                Number(Cache.get(`source_index_${streamId}`))
              ].split("|")[0],
            source_2: layersForSelect[index].split("|")[0],
          }),
          {
            parse_mode: "HTML",
            reply_markup: markup.inlineKeyboard(keybs),
          },
        );
        return;
      }

      if (act === "confirm") {
        const layersForSelect = String(getSource).split("<>");
        const picked = layersForSelect[index];

        ctx.editMessageText(t("en", "ch_source_message"));
        Cache.set(`source_index_${streamId}`, index);
        Cache.set(`used_source_${streamId}`, picked);
        Cache.set(`ch_message_id_${streamId}`, cb!.message!.message_id);
        Streams.changeSource(streamId);
        return;
      }

      if (act === "add") {
        const getSource = Cache.get(`raw_source_${streamId}`);
        var keyb = [];
        keyb = [
          btn.text(
            t("en", "cancel_button"),
            getSource ? `layer_list_0_${streamId}` : `cancel_session`,
          ),
        ];
        ctx.editMessageText(t("en", "send_name_layer_message"), {
          parse_mode: "HTML",
          reply_markup: markup.inlineKeyboard(keyb),
        });
        Cache.set(`session_name_layer_${chatID}`, true);
        return;
      }
    }

    if ((match = /stopStream_(.+)_(.+)/i.exec(cbData))) {
      const act = match[1];
      const streamId = match[2];

      const streamKey = Cache.get(`stream_key_${streamId}`);
      if (!streamKey) {
        ctx.answerCallbackQuery({
          text: t("en", "stream_key_not_found_message"),
          show_alert: true,
        });
        ctx.deleteMessage().catch(() => {});
        return;
      }

      ctx.editMessageText(t("en", "process_message")).catch(() => {});
      if (act === "stop") {
        Streams.stop(streamId);
      }
      if (act === "forceStop") {
        Streams.forceStop(streamId);
      }
      return;
    }

    if ((match = /stream_(.+)_(.+)/i.exec(cbData))) {
      const act = match[1];
      const streamId = match[2];
      const streamKey = Cache.get(`stream_key_${streamId}`);
      if (!streamKey) {
        ctx.answerCallbackQuery({
          text: t("en", "stream_key_not_found_message"),
          show_alert: true,
        });
        ctx.deleteMessage().catch(() => {});
        return;
      }
      const isStarted = Cache.get(`started_${streamId}`) ? true : false;

      if (act === "return") {
        if (Cache.get(`stream_${streamId}`)) {
          Cache.del(`in_settings_${streamId}`);
          Cache.del(`has_sent_conf_${streamId}`);
        }
        Cache.del(`loop_stream_${chatID}`);
        Cache.del(`bmb_stream_${chatID}`);
        Cache.del(`speed_stream_${chatID}`);
        const keyb = Helper.generateStreamConfig(
          Cache.get(`paused_${streamId}`) ? "paused" : "running",
          streamId,
          isStarted,
        );
        ctx
          .editMessageText(
            t(
              "en",
              Cache.get(`stream_${streamId}`)
                ? "started_message"
                : "confirm_start_stream_message",
              {
                frame: "-",
                fps: "-",
                qscale: "-",
                size: "-",
                time: "-",
                bitrate: "-",
                dup: "-",
                drop: "",
                speed: "-",
                source: String(Cache.get(`used_source_${streamId}`)).split(
                  "|",
                )[0],
              },
            ),
            {
              parse_mode: "HTML",
              reply_markup: markup.inlineKeyboard(keyb),
            },
          )
          .then(() => {
            if (Cache.get(`conf_change_${streamId}`)) {
              if (!Cache.get(`stream_${streamId}`)) return;
              var keybs = [];
              keybs = [
                btn.text(
                  t("en", "restart_button"),
                  `stream_restart_${streamId}`,
                  "success",
                ),
              ];

              bot.api
                .deleteMessage(chatID, Number(Cache.get(`restart_${streamId}`)))
                .catch(() => {});
              Cache.set(`restart_${streamId}`, cb!.message!.message_id);
              ctx.reply(t("en", "change_detect_message"), {
                parse_mode: "HTML",
                reply_markup: markup.inlineKeyboard(keybs),
              });
            }
          });
        return;
      }

      if (Cache.get(`stream_${streamId}`)) {
        Cache.set(`in_settings_${streamId}`, true);
        Cache.set(`has_sent_conf_${streamId}`, true);
      }

      if (act === "restart") {
        bot.api.deleteMessage(chatID, Number(Cache.get(`restart_${streamId}`)));
        Cache.del(`restart_${streamId}`);

        ctx.editMessageText(t("en", "starting_message"), {
          parse_mode: "HTML",
        });
        Cache.set(`restart_msg_id_${streamId}`, cb!.message!.message_id);
        Streams.restart(streamId);
        return;
      }

      if (act === "start") {
        Cache.set(`stream_${chatID}`, true);
        ctx.editMessageText(t("en", "starting_message"), {
          parse_mode: "HTML",
        });
        const mediaSource = String(Cache.get(`used_source_${streamId}`)).split(
          "|",
        );

        Streams.start(
          streamId,
          chatID,
          String(Cache.get(`stream_key_${streamId}`)),
          mediaSource[1],
          bot,
          Number(cb!.message!.message_id),
          false,
          false,
          mediaSource[2],
        );
        return;
      }

      if (act === "cancel") {
        ctx.editMessageText(t("en", "stream_cancelled_message"), {
          parse_mode: "HTML",
        });
        return;
      }

      if (/(resume|pause|stop)/i.exec(act)) {
        if (Cache.get(`blocks_${streamId}`))
          return ctx.answerCallbackQuery({
            text: t("en", "wait_act_message"),
            show_alert: true,
          });
        if (act === "resume") {
          const action = Streams.resume(
            streamId,
            chatID,
            bot,
            Number(cb!.message!.message_id),
          );
          if (action === "not_paused")
            return ctx.answerCallbackQuery({
              text: t("en", "stream_not_paused"),
              show_alert: true,
            });
          ctx.editMessageText(t("en", "starting_message"), {
            parse_mode: "HTML",
          });
        } else if (act === "pause") {
          const action = Streams.pause(streamId);
          if (action === "paused")
            return ctx.answerCallbackQuery({
              text: t("en", "stream_is_paused"),
              show_alert: true,
            });

          const keyb = Helper.generateStreamConfig("paused", streamId, true);
          ctx.editMessageReplyMarkup({
            reply_markup: markup.inlineKeyboard(keyb),
          });
        } else if (act === "stop" || act === "forceStop") {
          var keyb = [];
          keyb = [
            btn.text(
              t("en", "yes_button"),
              `stopStream_${act}_${streamId}`,
              "success",
            ),
            btn.text(
              t("en", "no_button"),
              `stream_return_${streamId}`,
              "danger",
            ),
          ];

          ctx.editMessageText(t("en", "confirm_stop_message"), {
            parse_mode: "HTML",
            reply_markup: markup.inlineKeyboard(keyb),
          });
        }
        return;
      }

      if (act === "tune") {
        const getTune = String(
          Cache.get(`stream_tune_${streamId}`) ?? "zerolatency",
        );
        const tuneData = [
          "zerolatency",
          "film",
          "animation",
          "grain",
          "stillimage",
          "fastdecode",
        ];

        var keybs = [];
        tuneData.map((id) => {
          keybs.push([
            btn.text(
              `${id} ${getTune === id ? "✅" : ""}`,
              `tune_${id}_${streamId}`,
            ),
          ]);
        });
        keybs.push([
          btn.text(t("en", "return_button"), `stream_return_${streamId}`),
        ]);

        ctx.editMessageText(t("en", "tune_message"), {
          parse_mode: "HTML",
          reply_markup: markup.inlineKeyboard(keybs),
        });
        return;
      }

      if (act === "preset") {
        const getPreset = String(
          Cache.get(`stream_preset_${streamId}`) ?? "ultrafast",
        );

        const presetData = [
          "ultrafast|(low CPU)",
          "superfast|(small CPU)",
          "veryfast|(small CPU)",
          "faster|(medium CPU)",
          "fast|(medium CPU)",
          "medium|(high CPU)",
          "slow|(high CPU)",
        ];

        var keybs = [];
        presetData.map((id) => {
          const data = id.split("|");
          keybs.push([
            btn.text(
              `${data.join(" ")} ${getPreset === data[0] ? "✅" : ""}`,
              `preset_${data[0]}_${streamId}`,
            ),
          ]);
        });
        keybs.push([
          btn.text(t("en", "return_button"), `stream_return_${streamId}`),
        ]);

        ctx.editMessageText(t("en", "preset_message"), {
          parse_mode: "HTML",
          reply_markup: markup.inlineKeyboard(keybs),
        });
        return;
      }

      if (act === "loop") {
        if (
          Helper.checkOpt(streamId) ||
          Helper.permsYt(streamId).includes("loop")
        )
          return ctx.answerCallbackQuery({
            text: t("en", "opt_unv_yt_message"),
            show_alert: true,
          });
        const getLoop = String(Cache.get(`stream_loop_${streamId}`) ?? 0);

        var keybs = [];
        keybs = [
          btn.text(t("en", "return_button"), `stream_return_${streamId}`),
        ];

        ctx.editMessageText(t("en", "loop_message", { loop: getLoop }), {
          parse_mode: "HTML",
          reply_markup: markup.inlineKeyboard(keybs),
        });
        Cache.set(`loop_stream_${chatID}`, streamId);
        return;
      }

      if (act === "fps") {
        const getFPS = String(Cache.get(`stream_fps_${streamId}`) ?? 30);

        var keybs = [];
        keybs[0] = [
          btn.text(`30 ${getFPS === "30" ? "✅" : ""}`, `fps_30_${streamId}`),
          btn.text(`60 ${getFPS === "60" ? "✅" : ""}`, `fps_60_${streamId}`),
        ];
        keybs[1] = [
          btn.text(t("en", "return_button"), `stream_return_${streamId}`),
        ];

        ctx.editMessageText(t("en", "fps_message"), {
          parse_mode: "HTML",
          reply_markup: markup.inlineKeyboard(keybs),
        });
        return;
      }

      if (/(bitratev|maxrate|bufsize)/i.exec(act)) {
        const getValue = String(Cache.get(`stream_${act}_${streamId}`) ?? 2500);

        var keybs = [];
        keybs = [
          btn.text(t("en", "return_button"), `stream_return_${streamId}`),
        ];

        ctx.editMessageText(
          //@ts-ignore
          t("en", `${act}_message`, { value: `${getValue}k` }),
          {
            parse_mode: "HTML",
            reply_markup: markup.inlineKeyboard(keybs),
          },
        );
        Cache.set(`bmb_stream_${chatID}`, `${act}|${streamId}`);
        return;
      }

      if (act === "bitratea") {
        const getBitrateA = String(
          Cache.get(`stream_bitratea_${streamId}`) ?? "128k",
        );

        var keybs = [];
        keybs[0] = [
          btn.text(
            `96k ${getBitrateA === "96k" ? "✅" : ""}`,
            `bitrate_96_${streamId}`,
          ),
          btn.text(
            `128k ${getBitrateA === "128k" ? "✅" : ""}`,
            `bitrate_128_${streamId}`,
          ),
        ];
        keybs[1] = [
          btn.text(t("en", "return_button"), `stream_return_${streamId}`),
        ];

        ctx.editMessageText(t("en", "bitratea_message"), {
          parse_mode: "HTML",
          reply_markup: markup.inlineKeyboard(keybs),
        });
        return;
      }

      if (/(videoCodec|audioCodec)/i.exec(act)) {
        const type = act === "videoCodec" ? "video" : "audio";
        const def = act === "videoCodec" ? "libx264" : "aac";
        const getCodec = String(
          Cache.get(`stream_${type}_codec_${streamId}`) ?? def,
        );

        const codecList =
          act === "videoCodec"
            ? ["libx264", "libx265", "libsvtav1"]
            : ["aac", "libmp3lame", "libopus", "libvorbis", "ac3", "pcm_s16le"];
        var keybs = [];
        codecList.map((id) => {
          keybs.push([
            btn.text(
              `${id} ${getCodec === id ? "✅" : ""}`,
              `codec_${type}_${id}_${streamId}`,
            ),
          ]);
        });
        keybs.push([
          btn.text(t("en", "return_button"), `stream_return_${streamId}`),
        ]);

        ctx.editMessageText(
          //@ts-ignore
          t("en", `${act}_message`),
          {
            parse_mode: "HTML",
            reply_markup: markup.inlineKeyboard(keybs),
          },
        );
        return;
      }

      if (act === "sample") {
        const getSampleRate = String(
          Cache.get(`stream_sample_rate_${streamId}`) ?? "48000",
        );

        var keybs = [];
        keybs[0] = [
          btn.text(
            `44100 (44.1 kHz) ${getSampleRate === "44100" ? "✅" : ""}`,
            `sampleRate_44100_${streamId}`,
          ),
          btn.text(
            `48000 (48 kHz) ${getSampleRate === "48000" ? "✅" : ""}`,
            `sampleRate_48000_${streamId}`,
          ),
        ];
        keybs[1] = [
          btn.text(t("en", "return_button"), `stream_return_${streamId}`),
        ];

        ctx.editMessageText(t("en", "sampleRate_message"), {
          parse_mode: "HTML",
          reply_markup: markup.inlineKeyboard(keybs),
        });
        return;
      }

      if (act === "speed") {
        if (Helper.checkOpt(streamId) || Helper.permsYt(streamId).includes("speed"))
          return ctx.answerCallbackQuery({
            text: t("en", "opt_unv_yt_message"),
            show_alert: true,
          });
        const getPSpeed = String(
          Cache.get(`stream_playback_speed_${streamId}`) ?? "1",
        );

        var keybs = [];
        keybs = [
          btn.text(t("en", "return_button"), `stream_return_${streamId}`),
        ];

        ctx.editMessageText(t("en", "playback_message", { value: getPSpeed }), {
          parse_mode: "HTML",
          reply_markup: markup.inlineKeyboard(keybs),
        });
        Cache.set(`speed_stream_${chatID}`, streamId);
        return;
      }
    }

    // STREAM CONFIG
    if ((match = /tune_(.+)_(.+)/i.exec(cbData))) {
      const act = match[1];
      const streamId = match[2];
      const streamKey = Cache.get(`stream_key_${streamId}`);
      if (!streamKey) {
        ctx.answerCallbackQuery({
          text: t("en", "stream_key_not_found_message"),
          show_alert: true,
        });
        ctx.deleteMessage().catch(() => {});
        return;
      }

      const getTune = String(
        Cache.get(`stream_tune_${streamId}`) ?? "zerolatency",
      );
      if (getTune === act) return ctx.answerCallbackQuery();
      const tuneData = [
        "zerolatency",
        "film",
        "animation",
        "grain",
        "stillimage",
        "fastdecode",
      ];

      var keybs = [];
      tuneData.map((id) => {
        keybs.push([
          btn.text(`${id} ${act === id ? "✅" : ""}`, `tune_${id}_${streamId}`),
        ]);
      });
      keybs.push([
        btn.text(t("en", "return_button"), `stream_return_${streamId}`),
      ]);

      ctx.editMessageReplyMarkup({
        reply_markup: markup.inlineKeyboard(keybs),
      });
      Cache.set(`conf_change_${streamId}`, true);
      Cache.set(`stream_tune_${streamId}`, act);
      Database.edit("user", "id", chatID, "stream_tune", act);
      return;
    }

    if ((match = /preset_(.+)_(.+)/i.exec(cbData))) {
      const act = match[1];
      const streamId = match[2];
      const streamKey = Cache.get(`stream_key_${streamId}`);
      if (!streamKey) {
        ctx.answerCallbackQuery({
          text: t("en", "stream_key_not_found_message"),
          show_alert: true,
        });
        ctx.deleteMessage().catch(() => {});
        return;
      }

      const getPreset = String(
        Cache.get(`stream_preset_${streamId}`) ?? "ultrafast",
      );
      if (getPreset === act) return ctx.answerCallbackQuery();
      const presetData = [
        "ultrafast|(low CPU)",
        "superfast|(small CPU)",
        "veryfast|(small CPU)",
        "faster|(medium CPU)",
        "fast|(medium CPU)",
        "medium|(high CPU)",
        "slow|(high CPU)",
      ];

      var keybs = [];
      presetData.map((id) => {
        const data = id.split("|");
        keybs.push([
          btn.text(
            `${data.join(" ")} ${act === data[0] ? "✅" : ""}`,
            `preset_${data[0]}_${streamId}`,
          ),
        ]);
      });
      keybs.push([
        btn.text(t("en", "return_button"), `stream_return_${streamId}`),
      ]);

      ctx.editMessageReplyMarkup({
        reply_markup: markup.inlineKeyboard(keybs),
      });
      Cache.set(`conf_change_${streamId}`, true);
      Cache.set(`stream_preset_${streamId}`, act);
      Database.edit("user", "id", chatID, "stream_preset", act);
      return;
    }

    if ((match = /fps_(.+)_(.+)/i.exec(cbData))) {
      const act = match[1];
      const streamId = match[2];
      const streamKey = Cache.get(`stream_key_${streamId}`);
      if (!streamKey) {
        ctx.answerCallbackQuery({
          text: t("en", "stream_key_not_found_message"),
          show_alert: true,
        });
        ctx.deleteMessage().catch(() => {});
        return;
      }
      const getFPS = String(Cache.get(`stream_fps_${streamId}`) ?? 30);
      if (getFPS === act) return ctx.answerCallbackQuery();
      var keybs = [];
      keybs[0] = [
        btn.text(`30 ${act === "30" ? "✅" : ""}`, `fps_30_${streamId}`),
        btn.text(`60 ${act === "60" ? "✅" : ""}`, `fps_60_${streamId}`),
      ];
      keybs[1] = [
        btn.text(t("en", "return_button"), `stream_return_${streamId}`),
      ];

      ctx.editMessageReplyMarkup({
        reply_markup: markup.inlineKeyboard(keybs),
      });
      Cache.set(`conf_change_${streamId}`, true);
      Cache.set(`stream_fps_${streamId}`, act);
      Database.edit("user", "id", chatID, "stream_fps", act);
      return;
    }

    if ((match = /bitrate_(.+)_(.+)/i.exec(cbData))) {
      const act = match[1];
      const streamId = match[2];
      const streamKey = Cache.get(`stream_key_${streamId}`);
      if (!streamKey) {
        ctx.answerCallbackQuery({
          text: t("en", "stream_key_not_found_message"),
          show_alert: true,
        });
        ctx.deleteMessage().catch(() => {});
        return;
      }

      const getBitrateA = String(
        Cache.get(`stream_bitratea_${streamId}`) ?? "128k",
      );
      if (getBitrateA === act) return ctx.answerCallbackQuery();
      var keybs = [];
      keybs[0] = [
        btn.text(`96k ${act === "96k" ? "✅" : ""}`, `bitrate_96_${streamId}`),
        btn.text(
          `128k ${act === "128k" ? "✅" : ""}`,
          `bitrate_128_${streamId}`,
        ),
      ];
      keybs[1] = [
        btn.text(t("en", "return_button"), `stream_return_${streamId}`),
      ];

      ctx.editMessageReplyMarkup({
        reply_markup: markup.inlineKeyboard(keybs),
      });
      Cache.set(`stream_bitratea_${streamId}`, act);
      Database.edit("user", "id", chatID, "stream_bitratea", act);
      return;
    }

    if ((match = /codec_(.+)_(.+)_(.+)/i.exec(cbData))) {
      const type = match[1];
      const act = match[2];
      const streamId = match[3];
      const streamKey = Cache.get(`stream_key_${streamId}`);
      if (!streamKey) {
        ctx.answerCallbackQuery({
          text: t("en", "stream_key_not_found_message"),
          show_alert: true,
        });
        ctx.deleteMessage().catch(() => {});
        return;
      }

      const def = type === "video" ? "libx264" : "aac";
      const getCodec = String(
        Cache.get(`stream_${type}_codec_${streamId}`) ?? def,
      );
      if (getCodec === act) return ctx.answerCallbackQuery();
      const codecList =
        type === "video"
          ? ["libx264", "libx265", "libsvtav1"]
          : ["aac", "libmp3lame", "libopus", "libvorbis", "ac3", "pcm_s16le"];
      var keybs = [];
      codecList.map((id) => {
        keybs.push([
          btn.text(
            `${id} ${act === id ? "✅" : ""}`,
            `codec_${type}_${id}_${streamId}`,
          ),
        ]);
      });
      keybs.push([
        btn.text(t("en", "return_button"), `stream_return_${streamId}`),
      ]);

      ctx.editMessageReplyMarkup({
        reply_markup: markup.inlineKeyboard(keybs),
      });
      Cache.set(`conf_change_${streamId}`, true);
      Cache.set(`stream_${type}_codec_${streamId}`, act);
      Database.edit("user", "id", chatID, `stream_${type}_codec`, act);
      return;
    }

    if ((match = /sampleRate_(.+)_(.+)/i.exec(cbData))) {
      const act = match[1];
      const streamId = match[2];
      const streamKey = Cache.get(`stream_key_${streamId}`);
      if (!streamKey) {
        ctx.answerCallbackQuery({
          text: t("en", "stream_key_not_found_message"),
          show_alert: true,
        });
        ctx.deleteMessage().catch(() => {});
        return;
      }

      const getSampleRate = String(
        Cache.get(`stream_sample_rate_${streamId}`) ?? "48000",
      );
      if (getSampleRate === act) return ctx.answerCallbackQuery();
      var keybs = [];
      keybs[0] = [
        btn.text(
          `44100 (44.1 kHz) ${act === "44100" ? "✅" : ""}`,
          `sampleRate_44100_${streamId}`,
        ),
        btn.text(
          `48000 (48 kHz) ${act === "48000" ? "✅" : ""}`,
          `sampleRate_48000_${streamId}`,
        ),
      ];
      keybs[1] = [
        btn.text(t("en", "return_button"), `stream_return_${streamId}`),
      ];

      ctx.editMessageReplyMarkup({
        reply_markup: markup.inlineKeyboard(keybs),
      });
      Cache.set(`conf_change_${streamId}`, true);
      Cache.set(`stream_sample_rate_${streamId}`, act);
      Database.edit("user", "id", chatID, "stream_sample_rate", act);
      return;
    }
  }
}
