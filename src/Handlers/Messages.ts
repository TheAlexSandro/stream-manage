import { Context, Bot } from "grammy";
import { t } from "../Middlewares/i18n";
import { Helper } from "../Components/Helper/Helper";
import { Cache } from "../Components/Caches/Cache";
import { Database } from "../Components/Database/Database";
import type { UserDB } from "../types/type";
import { btn, markup } from "../Components/Buttons/InlineButton";

const controller = new AbortController();

export class Messages {
  static handle(ctx: Context, bot: Bot) {
    const chatID = String(ctx.chat?.id);
    const text = String(ctx.message?.text);

    var pola = /^\/start$/i;
    if (pola.exec(text)) {
      ctx.reply(t("en", "start_message", { name: Helper.getName(ctx) }), {
        parse_mode: "HTML",
      });
      Database.add("user", chatID);
      return;
    }

    var pola = /^\/add$/i;
    if (pola.exec(text)) {
      ctx.reply(t("en", "process_message")).then((message_result) => {
        Database.get("user", "id", chatID, (err, db_result: UserDB) => {
          if (err || !db_result)
            return bot.api.editMessageText(
              chatID,
              message_result?.message_id,
              t("en", "error_message"),
              { parse_mode: "HTML" },
            );

          const getStream = db_result["stream_list"];
          if (getStream)
            return bot.api.editMessageText(
              chatID,
              message_result?.message_id,
              t("en", "stream_avail_message"),
              { parse_mode: "HTML" },
            );
          var keyb = [];
          keyb = [btn.text(t("en", "cancel_button"), `cancel_session`)];
          bot.api.editMessageText(
            chatID,
            message_result.message_id,
            t("en", "stream_message_url"),
            {
              parse_mode: "HTML",
              reply_markup: markup.inlineKeyboard(keyb),
            },
          );
          Cache.set(`session_add_${chatID}`, true);
        });
      });
      return;
    }

    var pola = /^\/layer$/i;
    if (pola.exec(text)) {
      ctx.reply(t("en", "process_message")).then((message_result) => {
        Database.get("user", "id", chatID, (err, db_result: UserDB) => {
          if (err || !db_result)
            return bot.api.editMessageText(
              chatID,
              message_result?.message_id,
              t("en", "error_message"),
              { parse_mode: "HTML" },
            );

          const getStream = db_result["stream_list"];
          if (!getStream)
            return bot.api.editMessageText(
              chatID,
              message_result?.message_id,
              t("en", "no_stream_list"),
              { parse_mode: "HTML" },
            );
          const streamId = Cache.get<string>(`stream_id_${chatID}`);
          if (!streamId)
            return bot.api.editMessageText(
              chatID,
              message_result?.message_id,
              t("en", "not_initial_message"),
              { parse_mode: "HTML" },
            );
          const getSource = Cache.get(`raw_source_${streamId}`);

          if (!getSource) {
            var keyb = [];
            keyb = [btn.text(t("en", "cancel_button"), `cancel_session`)];
            bot.api.editMessageText(
              chatID,
              message_result.message_id,
              t("en", "send_name_layer_message"),
              {
                parse_mode: "HTML",
                reply_markup: markup.inlineKeyboard(keyb),
              },
            );
            Cache.set(`session_name_layer_${chatID}`, true);
          } else {
            var keyb = [];
            const layers = String(getSource).split("<>");

            layers.map((item: string, index: number) => {
              const data = item.split("|");
              const isCurrentIndex =
                index === Number(Cache.get(`source_index_${streamId}`));

              keyb.push([
                btn.text(
                  `${data[0]} ${isCurrentIndex ? `✅` : ``}`,
                  `layer_select_${index}_${streamId}`,
                ),
                btn.text(`🗑`, `layer_delete_${index}_${streamId}`, "danger"),
              ]);
            });
            if (layers.length < Number(process.env["MAX_LAYER"])) {
              keyb.push([
                btn.text(t("en", "add_button"), `layer_add_0_${streamId}`),
              ]);
            }
            bot.api.editMessageText(
              chatID,
              message_result.message_id,
              t("en", "layer_list_message", {
                max_layer: String(process.env["MAX_LAYER"]),
              }),
              {
                parse_mode: "HTML",
                reply_markup: markup.inlineKeyboard(keyb),
              },
            );
          }
        });
      });
      return;
    }

    var pola = /^\/stream$/i;
    if (pola.exec(text)) {
      ctx.reply(t("en", "process_message")).then((message_result) => {
        Database.get("user", "id", chatID, (err, db_result: UserDB) => {
          if (err || !db_result)
            return bot.api.editMessageText(
              chatID,
              message_result?.message_id,
              t("en", "error_message"),
              { parse_mode: "HTML" },
            );

          const getStream = db_result["stream_list"];
          if (!getStream)
            return bot.api.editMessageText(
              chatID,
              message_result?.message_id,
              t("en", "no_stream_list"),
              { parse_mode: "HTML" },
            );

          if (!Cache.get(`stream_id_${chatID}`)) {
            const streamId = Helper.generateID(20);
            Cache.set(`stream_id_${chatID}`, streamId);
            const streamKey = db_result["stream_list"];

            Cache.set(`stream_key_${streamId}`, streamKey);
            bot.api.editMessageText(
              chatID,
              message_result.message_id,
              t("en", "stream_init_message", { id: streamId }),
              { parse_mode: "HTML" },
            );
          } else {
            const streamId = String(Cache.get(`stream_id_${chatID}`));
            if (
              Cache.get(`silent_${streamId}`) ||
              Cache.get(`stops_${streamId}`) ||
              Cache.get(`starting_${streamId}`)
            )
              return bot.api.editMessageText(
                chatID,
                message_result.message_id,
                t("en", "stream_change_proc_message"),
                {
                  parse_mode: "HTML",
                },
              );
            if (Cache.get(`stream_${streamId}`)) {
              var keybs = [];
              keybs = [
                btn.text(
                  t("en", "check_stream_button"),
                  `stream_return_${streamId}`,
                ),
              ];
              bot.api.editMessageText(
                chatID,
                message_result.message_id,
                t("en", "stream_started_message"),
                {
                  parse_mode: "HTML",
                  reply_markup: markup.inlineKeyboard(keybs),
                },
              );
              return;
            }

            const getSource = Cache.get(`raw_source_${streamId}`);
            if (!Cache.get(`raw_source_${streamId}`))
              return bot.api.editMessageText(
                chatID,
                message_result.message_id,
                t("en", "source_empty_message"),
                { parse_mode: "HTML" },
              );
            if (
              String(getSource!).split("<>").length > 1 &&
              !Cache.get(`used_source_${streamId}`)
            )
              return bot.api.editMessageText(
                chatID,
                message_result.message_id,
                t("en", "source_not_select_message"),
                { parse_mode: "HTML" },
              );

            const streamProperty = [
              `stream_loop`,
              `stream_fps`,
              `stream_video_codec`,
              `stream_preset`,
              `stream_bitratev`,
              `stream_bitratea`,
              `stream_maxrate`,
              `stream_bufsize`,
              `stream_tune`,
              `stream_audio_codec`,
              `stream_sample_rate`,
              `stream_playback_speed`,
              `stream_pause_thumbnail`,
              `stream_ended_thumbnail`,
              `stream_logo`,
              `stream_textwn`,
            ];

            streamProperty.map((id) => {
              Cache.set(`${id}_${streamId}`, (db_result as any)[id]);
            });

            const splits = String(getSource!).split("<>");
            let picked;

            if (splits.length > 1) {
              picked = String(Cache.get(`used_source_${streamId}`)).split("|");
            } else {
              picked = splits[0].split("|");
              Cache.set(`source_index_${streamId}`, 0);
              Cache.set(`used_source_${streamId}`, splits[0]);
            }

            const keyb = Helper.generateStreamConfig("none", streamId, false);
            bot.api.editMessageText(
              chatID,
              message_result.message_id,
              t("en", "confirm_start_stream_message", {
                source: picked[0],
              }),
              { parse_mode: "HTML", reply_markup: markup.inlineKeyboard(keyb) },
            );
          }
        });
      });
      return;
    }

    var pola = /^\/abort$/i;
    if (pola.exec(text)) {
      ctx.reply(t("en", "process_message")).then((message_result) => {
        const streamId = Cache.get<string>(`stream_id_${chatID}`);
        if (!streamId)
          return bot.api.editMessageText(
            chatID,
            message_result?.message_id,
            t("en", "not_initial_message"),
            { parse_mode: "HTML" },
          );

        var keyb = [];
        keyb = [
          btn.text(t("en", "yes_button"), `abort_all_${streamId}`, "success"),
          btn.text(t("en", "no_button"), `delete_`, "danger"),
        ];

        bot.api.editMessageText(
          chatID,
          message_result.message_id,
          t("en", "abort_message"),
          { parse_mode: "HTML", reply_markup: markup.inlineKeyboard(keyb) },
        );
      });
    }

    var pola = /^\/config$/i;
    if (pola.exec(text)) {
      var keyb = [];
      keyb = [btn.text(t("en", "change_stream_button"), `config_key`)];

      ctx.reply(t("en", "config_message"), {
        parse_mode: "HTML",
        reply_markup: markup.inlineKeyboard(keyb),
      });
      return;
    }

    // SESSION
    const getSessionNLayer = Cache.get(`session_name_layer_${chatID}`);
    const getSessionLayer = Cache.get(`session_layer_${chatID}`);
    const getSessionAdd = Cache.get(`session_add_${chatID}`);
    const getSessionKey = Cache.get(`session_key_${chatID}`);

    const getSessionStreamLoop = Cache.get(`loop_stream_${chatID}`);
    const getSessionStreamBMB = Cache.get(`bmb_stream_${chatID}`);
    const getSessionStreamSpeed = Cache.get(`speed_stream_${chatID}`);

    if (getSessionNLayer) {
      if (!ctx.message?.text) return ctx.reply(t("en", "stream_text_only"));
      if (text.length > 50) return ctx.reply(t("en", "name_length_ex_message"));
      var keyb = [];
      keyb[0] = [
        btn.url(
          t("en", "example_button"),
          `${process.env["EXAMPLE_DIRECT_LINK"]}`,
        ),
      ];
      keyb[1] = [btn.text(t("en", "cancel_button"), `cancel_session`)];

      Cache.set(`session_layer_${chatID}`, text);
      Cache.del(`session_name_layer_${chatID}`);
      ctx.reply(t("en", "add_layer_message"), {
        parse_mode: "HTML",
        reply_markup: markup.inlineKeyboard(keyb),
      });
      return;
    }

    if (getSessionLayer) {
      if (ctx.message!.photo) return ctx.reply(t("en", "pht_warning_message"));
      if (!ctx.message?.video && !ctx.message?.text && !ctx.message?.document)
        return ctx.reply(t("en", "source_err_message"));

      if (
        ctx.message?.video &&
        ctx.message?.video?.file_size &&
        ctx.message?.video?.file_size > 20 * 1024 * 1024
      )
        return ctx.reply(t("en", "size_exceed_message"));

      const isUrl =
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/i.test(
          text,
        );

      if (!isUrl) {
        return ctx.reply(t("en", "url_invalid"));
      }

      Cache.del(`session_layer_${chatID}`);
      const sourceId = Helper.generateID(10);
      const streamId = String(Cache.get(`stream_id_${chatID}`));
      const getSource = Cache.get(`raw_source_${streamId}`);
      if (text.includes("youtube.com") || text.includes("youtu.be")) {
        if (!Helper.isYT(text)) {
          return ctx.reply(t("en", "yt_inv_message"));
        }

        ctx.reply(t("en", "checkyt_message")).then((message_result) => {
          Helper.isLive(text, (err, isLive) => {
            if (err)
              return bot.api.editMessageText(
                chatID,
                message_result.message_id,
                t("en", "error_message"),
                { parse_mode: "HTML" },
              );

            const source = ctx.message?.video
              ? ctx.message?.video.file_id
              : text;
            const writeSource = !getSource
              ? `${getSessionLayer}|${source}|${sourceId}`
              : `${getSource}<>${getSessionLayer}|${source}|${sourceId}`;
            Cache.set(`raw_source_${streamId}`, writeSource);
            Cache.set(`is_live_yt_${sourceId}_${streamId}`, isLive);
            Cache.set(`yt_denied_${sourceId}_${streamId}`, `loop,speed`);

            bot.api.editMessageText(
              chatID,
              message_result.message_id,
              t("en", "layer_add_message"),
              {
                parse_mode: "HTML",
              },
            );
          });
        });
      } else {
        const source = ctx.message?.video ? ctx.message?.video.file_id : text;
        const writeSource = !getSource
          ? `${getSessionLayer}|${source}|${sourceId}`
          : `${getSource}<>${getSessionLayer}|${source}|${sourceId}`;
        Cache.set(`raw_source_${streamId}`, writeSource);

        ctx.reply(t("en", "layer_add_message"), {
          parse_mode: "HTML",
        });
      }
      return;
    }

    if (getSessionAdd) {
      if (!ctx.message?.text) return ctx.reply(t("en", "stream_text_only"));
      if (!/^rtmps:\/\/dc[1-9]\d*-[1-9]\d*\.rtmp\.t\.me\/s\/$/i.exec(text))
        return ctx.reply(t("en", "stream_unsupport"));

      Cache.del(`session_add_${chatID}`);
      Cache.set(`session_key_${chatID}`, text);
      var keyb = [];
      keyb = [btn.text(t("en", "cancel_button"), `cancel_session`)];
      ctx.reply(t("en", "stream_message_key"), {
        parse_mode: "HTML",
        reply_markup: markup.inlineKeyboard(keyb),
      });
      return;
    }

    if (getSessionKey) {
      if (!ctx.message?.text) return ctx.reply(t("en", "stream_text_only"));
      if (!/^\d{8,10}:[A-Za-z0-9_-]{20,}$/i.exec(text))
        return ctx.reply(t("en", "stream_key_invalid"));

      ctx.reply(t("en", "process_message")).then((message_result) => {
        Database.edit(
          "user",
          "id",
          chatID,
          "stream_list",
          `${getSessionKey}|${text}`,
        );
        Cache.del(`session_key_${chatID}`);
        bot.api.editMessageText(
          chatID,
          message_result?.message_id,
          t("en", "stream_add_success"),
          { parse_mode: "HTML" },
        );
      });
      return;
    }

    if (getSessionStreamLoop) {
      if (
        Helper.checkOpt(String(getSessionStreamLoop)) ||
        Helper.permsYt(String(getSessionStreamLoop)).includes("loop")
      )
        return ctx.reply(t("en", "opt_unv_yt_message"));
      if (!ctx.message?.text) return ctx.reply(t("en", "stream_text_only"));
      if (!/^([0-9]|10|-1)$/i.test(text))
        return ctx.reply(t("en", "loop_max_message"));

      Cache.set(`stream_loop_${getSessionStreamLoop}`, text);
      var keyb: any[] = [];
      keyb = [
        btn.text(
          t("en", "return_button"),
          `stream_return_${getSessionStreamLoop}`,
        ),
      ];
      ctx.reply(t("en", "saved_ops_message"), {
        parse_mode: "HTML",
        reply_markup: markup.inlineKeyboard(keyb),
      });
      Cache.set(`conf_change_${getSessionStreamLoop}`, true);
      Cache.del(`stream_loop_${chatID}`);
      Database.edit("user", "id", chatID, "stream_loop", text);
      return;
    }

    if (getSessionStreamBMB) {
      if (!ctx.message?.text) return ctx.reply(t("en", "stream_text_only"));
      if (!/\d+/i.exec(text)) return ctx.reply(t("en", "must_numb_message"));
      if (!/^([2-4][0-9]{3}|5000)$/i.test(text))
        return ctx.reply(t("en", "bmb_max_message"));
      const spls = String(getSessionStreamBMB).split("|");
      const type = spls[0];
      const streamId = spls[1];

      Cache.set(`stream_${type}_${streamId}`, text);
      var keyb: any[] = [];
      keyb = [btn.text(t("en", "return_button"), `stream_return_${streamId}`)];

      ctx.reply(t("en", "saved_ops_message"), {
        parse_mode: "HTML",
        reply_markup: markup.inlineKeyboard(keyb),
      });
      Cache.set(`conf_change_${streamId}`, true);
      Cache.del(`bmb_stream_${chatID}`);
      Database.edit("user", "id", chatID, `stream_${type}`, text);
      return;
    }

    if (getSessionStreamSpeed) {
      if (
        Helper.checkOpt(String(getSessionStreamSpeed)) ||
        Helper.permsYt(String(getSessionStreamSpeed)).includes("speed")
      )
        return ctx.reply(t("en", "opt_unv_yt_message"));
      if (!ctx.message?.text) return ctx.reply(t("en", "stream_text_only"));
      if (!/\d+/i.exec(text)) return ctx.reply(t("en", "must_numb_message"));
      if (!/^([1-9]|10)$/i.test(text))
        return ctx.reply(t("en", "speed_max_message"));

      Cache.set(`stream_playback_speed_${getSessionStreamSpeed}`, text);
      var keyb: any[] = [];
      keyb = [
        btn.text(
          t("en", "return_button"),
          `stream_return_${getSessionStreamSpeed}`,
        ),
      ];
      ctx.reply(t("en", "saved_ops_message"), {
        parse_mode: "HTML",
        reply_markup: markup.inlineKeyboard(keyb),
      });
      Cache.set(`conf_change_${getSessionStreamSpeed}`, true);
      Cache.del(`speed_stream_${chatID}`);
      Database.edit("user", "id", chatID, "stream_playback_speed", text);
      return;
    }
  }
}
