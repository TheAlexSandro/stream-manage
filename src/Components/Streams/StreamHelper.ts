import { Cache } from "../Caches/Cache";
import { Bot } from "grammy";
import { t } from "../../Middlewares/i18n";

export class StreamHelper {
  static closeStream(
    streamId: string,
    bot: Bot | null,
    chatId: string,
    message_id: number,
  ) {
    if (!Cache.get(`stream_${streamId}`)) return;
    if (Cache.get(`stops_${streamId}`)) {
      if (Cache.get(`has_sent_stops_${streamId}`)) return;
      const type = String(Cache.get(`stops_${streamId}`));
      const msg =
        type === "stop" ? "stop_stream_message" : "force_stop_stream_message";
      Cache.set(`has_sent_stops_${streamId}`, true);
      bot?.api
        .editMessageText(String(chatId), Number(message_id), t("en", msg), {
          parse_mode: "HTML",
        })
        .catch(() => {
          bot?.api.sendMessage(String(chatId), t("en", msg), {
            parse_mode: "HTML",
          });
        });
      return;
    }
  }

  static removeProperty(streamId: string) {
    const data = [
      `stream`,
      `starting`,
      `stream_position`,
      `has_sent_error`,
      `has_sent_slow`,
      `has_sent_conf`,
      `session_play`,
      `conf_message_id`,
      `stop`,
      `started`,
      `silent`,
      `stops`,
      `inits`,
      `in_settings`,
      `restart_msg_id`,
      `source_st`,
      `controller`,
    ];

    data.map((id) => {
      Cache.del(`${id}_${streamId}`);
    });
  }

  static abort(streamId: string, chatId: string) {
    const data = [
      `stream_source`,
      `stream_config`,
      `stream_key`,
      `raw_source`,
      `used_source`,
      `source_index`,
    ];

    Cache.del(`stream_id_${chatId}`);
    data.map((id) => {
      Cache.del(`${id}_${streamId}`);
    });
  }
}
