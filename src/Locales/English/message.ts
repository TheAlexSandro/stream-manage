export default {
  start_message:
    "👋 Hi! {NAME}! Welcome to the Telegram Stream Manager Bot, I can help you to stream in your group or channel without using high-end device or third-party software. Just in Telegram!\n\n🕹 Send the /stream command here to initiate or start streaming in your group or channel.\n\n🏞 Send the /layer command to add a media source for your stream, max is 10 sources.",
  stream_message_url:
    "❇️ <b>Add a new stream list</b>\nSend me the url server for streaming from your group or you channel. It must start with <code>rtmps://</code>",
  stream_message_key:
    "❇️ <b>Ok!</b>\nSend me the server key for your server url.",
  stream_text_only: "⚠️ Only text is supported.",
  stream_unsupport: "⚠️ Invalid server url.",
  stream_key_invalid: "⚠️ Invalid server key.",
  stream_avail_message: "⚠️ You can only have 1 stream list and the moment.",
  url_invalid: "⚠️ Invalid URL.",
  stream_add_success:
    "✅ <b>Success!</b>\nSuccessfully added the server url dan server key, manage them in /config or start the streaming now by sending the /stream command and add you source by using /layer command.",
  process_message: "⏳ Processing...",
  error_message: "❌ <b>Error!</b>\nSomething went wrong...",
  add_layer_message:
    "❇️ <b>Stream Media Source</b>\nSend me an url to a photo or a video, or send here a video that is less than or equal to 20 MB in size.\n\nIf it's a video and the size exceeds than 20 MB, consider upload your video to a CDN provider and send me direct link to the video.\n\n🖼 If you want to use an image, do not upload it here. Use a CDN provider and upload the direct link here.\n\nℹ️ Click the button below for example direct link video.\n\n📋 Recommended Formats:\n- Photo: jpeg, jpg\n- Video: mp4, mkv, flv\nAll of photo and video formats are supported (maybe).\n\n🌐 You can also send a video url from an online platform, supported platform:\n- YouTube (live stream url is also supported).",
  unsupport_platform_message: "⚠️ Currently supported platform is:\n- YouTube",
  source_err_message:
    "⚠️ Media source only support for url, photo and video only.",
  no_stream_list:
    "⚠️ You haven't set the stream server url dan server key, please set it up first by sending the /stream command.",
  getting_conf_message: "⏳ Getting configuration...",
  starting_message: "🚀 Starting stream, get ready...",
  stream_started_popup: "🚀 The stream has succesfully started!",
  on_stream_error_message:
    "❌ <b>Error Caught!</b>\nThere's something went wrong while sending the stream data, stream continues...",
  fatal_stream_error_message:
    "🚨 <b>Fatal Error Detected!</b>\nA fatal error has occurred, the stream has been stopped. Please check your media source or server url and server key, also check the file permissions and path.\n\nOr some of your configuration does not compatible with other options, please check https://ffmpeg.org/ffmpeg.html#Options for more information.",
  server_slow_warn_message:
    "⚠️ <b>Warning!</b>\nThe server is experiencing excessive workload, the stream may be interrupted.",
  stream_done_message:
    "✅ <b>Stream Finished!</b>\nAll of the stream data has been succesfully sent with no errors.\n\nStream other source by sending the /layer command or abort the stream and start over by using /abort command.",
  stream_done_err_message:
    "✅ <b>Stream Finished!</b>\nAll of the stream data has been sent with some ⚠️ non-fatal error.\n\nStream other source by sending the /layer command or abort the stream and start over by using /abort command.",
  started_message:
    "🚀 <b>Stream Started!</b>\nWhile we're sending the stream data, you can manage your streaming below...\n\nℹ️ If the video did not play, try to rejoin to the telegram stream and it it's still try to pause and resume the stream.\n\n🆔 <code>{ID}</code>\n🩻 Frame: <code>{FRAME}</code>\n⏱️ FPS: <code>{FPS}</code>\n💠 QScale: <code>{QSCALE}</code>\n🗂 Size: <code>{SIZE}</code>\n🕒 Time: <code>{TIME}</code>\n💈 Bitrate: <code>{BITRATE}</code>\n📑 Duplicate: <code>{DUP}</code>\n⬇️ Drop: <code>{DROP}</code>\n⚡️ Speed: <code>{SPEED}</code>\n🎞 Source: <code>{SOURCE}</code>\nUpdate every 10 second(s).",
  stream_error_with_reason_message:
    "🚨 <b>Fatal Error Detected!</b>\nA fatal error has occurred, the stream has been cancelled\nError: {ERROR}",
  stream_key_not_found_message: "⚠️ Stream is not available with this ID.",
  stream_is_paused: "⚠️ The stream is paused.",
  stream_not_paused: "⚠️ The stream is not paused.",
  confirm_stop_message:
    "⚠️ <b>Confirmation!</b>\nAre you sure you want to stop this stream? All of your stream source will be deleted and you have to start over.",
  source_change_message:
    "❇️ <b>Change Source</b>\nSend me the new video or url here.",
  confirm_start_stream_message:
    "❔<b>Start Stream</b>\nDo you want to start the stream now? or adjust the stream configuration first. You can always change the configuration after the stream started.\n\n🎞 Source: <code>{SOURCE}</code>",
  stop_stream_message:
    "✅ <b>Done!</b>\nThe stream has succesfully soft-stopped, all of the stream data has been cleared.\n\nStream other source by sending the /layer command or abort the stream and start over by using /abort command.",
  force_stop_stream_message:
    "💣 <b>Done!</b>\nThe stream has successfully force-stopped.\n⚠️ Some of the stream data may not cleared properly.\n\nStream other source by sending the /layer command or abort the stream and start over by using /abort command.",
  wait_act_message:
    "⚠️ Wait for the stream started succesfully before performing this action.",
  cancelled_message: "❌ Cancelled.",
  stream_cancelled_message:
    "✅ <b>Done!</b>\nThe stream has succesfully cancelled.\n\nStream other source by sending the /layer command or abort the stream and start over by using /abort command.",
  size_exceed_message:
    "⚠️ Size limit exceed than 20 MB, please consider upload it to CDN provider.",
  stream_init_message:
    "✅ <b>Initialized!</b>\nAdd your stream source by sending the /layer command.\nID: <code>{ID}</code>",
  layer_add_message:
    "✅ <b>Added!</b>\nThe stream source has succesfully added, start the stream now using /stream or add more layer using /layer.",
  send_name_layer_message:
    "❇️ <b>Ok!</b>\nSend me the identifier for your source (must be text 1-50 characters).",
  name_length_ex_message:
    "⚠️ The layer name length exceeds than 50 characters.",
  source_not_select_message:
    "⚠️ You have more than 1 source, please select 1 of the stream source you set before performing the stream.",
  source_empty_message:
    "⚠️ Please add at least 1 stream source before performing the stream by using the /layer command.",
  not_initial_message:
    "⚠️ You have not initialize the stream, send the /stream command first.",
  layer_list_message:
    "🏞 <b>Layer</b>\nHere are the available layers you have added, select one of the layer to start stream or add a new one, max is {MAX_LAYER} layers.",
  used_source_message:
    "⚠️ This source is used for streaming right now, please pause the stream first if you want to delete this source.",
  change_source_succ_message:
    "✅ <b>Done!</b>\nSuccessfully changed the stream source.",
  change_menu_message:
    "❕<b>Selection</b>\nWe have detected that this source has been played and replaced with another source before the duration ended. Would you like to continue the last duration or start from the beginning?",
  change_confirm_message:
    "❔<b>Confirmation</b>\nAre you sure you want to change <code>{SOURCE_1}</code> to <code>{SOURCE_2}</code>? This will stop the current streaming and replaced with the new source.",
  ch_source_message: "⏳ Changing source...",
  pht_warning_message:
    "⚠️ Please send your photo as document, or telegram will deduct it's quality to very bad quality. Only jpeg and png are supported.",
  invalid_pht_message:
    "⚠️ Only jpeg and png are supported and the file size can't exceeds than 20 MB.",
  stream_long_message:
    "⚠️ Starting stream take longer than usual, please wait... or if something feel unsual, you can abort the stream.",
  stream_started_message:
    "❕<b>Information</b>\nThe stream has been started, click the button below to check the current streaming.",
  tune_message:
    "🔼 <b>Tune</b>\nTune is a parameter used to optimize video encoding settings for specific types of input content or intended, enhancing quality or reducing latency.",
  preset_message:
    "🖼 <b>Preset</b>\nPreset is a configuration setting that acts as a shortcut for defining how fast or efficiently a video will be encoded. The faster it is, the smaller the CPU load, and vice versa.\n\nRecommended:\n- ultrafast for low CPU usage\n- veryfast if you want slightly sharper images but still want to keep the CPU load low.\n\nℹ️ It is not recommended to use medium/slow option, it is highly inadvisable to live stream in real time, as the server load will increase and the FPS will likely drop below 30, causing your stream to stutter.",
  loop_message:
    "🔄 <b>Stream Loop</b>\nStream loop is an option to specify the number of times a stream should be repeated.\n\nPass 0 means no looping\nPass 1-10 means num + 1, choose: 2 -> 3 loop\nPass -1 means infinite loop\n\nCurrent: <code>{LOOP}</code>\nEnter a number if you want to change (-1 to 10) only.",
  fps_message:
    "⏱️ <b>FPS</b>\nFPS (Frames Per Second) refers to the video frame rate, which dictates how many images are displayed per second to create motion.",
  bitratev_message:
    "✏️ <b>BitrateV</b>\nBitrateV (b:v) is an argument for determining the data speed (bandwidth) allocated for video streaming. This number determines how many “bits” are used to compose each second of the image..\n\n⚠️ Caution: If you set it too high, viewers on Telegram may experience constant buffering because their connections cannot download data that fast.\n\nCurrent: <code>{VALUE}</code>\nEnter a number if you want to change (2000-5000) only.",
  bitratea_message:
    "✏️ <b>BitrateA</b>\nBitrateA (b:a) is an argument for determining audio quality; the higher it is, the better.",
  maxrate_message:
    "📟 <b>Maxrate</b>\nMaxrate is an output option that caps the maximum bitrate of a video stream, preventing it from exceeding a specified value.\n\nℹ️ The maxrate value must exceeds the BitrateV value (recommended) and can't be more than bufsize value, it is not recommended to less than BitrateV value.\n\nCurrent: <code>{VALUE}</code>\nEnter a number if you want to change (2000-5000) only.",
  bufsize_message:
    "⭕️ <b>Bufsize</b>\nBufsize is a option to controls the size of the Video Buffering Verifier (VBV) buffer, which is a virtual buffer used to manage the bitrate of an encoded stream.\n\nℹ️ The bufsize value must exceeds the maxrate and BitrateV value (recommended) and it is not recommended to less than BitrateV and maxrate value.\n\nCurrent: <code>{VALUE}</code>\nEnter a number if you want to change (2000-5000) only.",
  videoCodec_message:
    "💾 <b>Video Codec</b>\nCodec-Decoder (codec) is a technology (in the form of software or hardware) that compresses (reduces the size) and decompresses (reopens) video files.\n\nWithout codecs, video file sizes would be enormous and impossible to stream or store on mobile phones or laptops.\n\nVideo Codec:\n- libx264 (H.264/AVC) -> it's compatible to all devices (recommended).\n- libx265 (H.265/HEVC) -> successor to H.264. 50% more space efficient, but requires a very powerful CPU.\n- libsvtav1 (AV1) -> the codec of the future, highly efficient and free, but the encoding process takes the longest.\n- libvpx-vp9 (VP9) -> Google/YouTube standard, alternative to H.265.",
  audioCodec_message:
    "🔈 <b>Audio Codec</b>\nAudio Codec stands for Audio Coder-Decoder. It is an algorithm or software that compresses audio data so that it can be easily sent over the internet, then decompresses it so that it can be heard by your ears.\n\nAudio Codec:\n- aac (AAC) -> streaming standard, the best quality for Telegram/YouTube streaming (recommended)\n- libmp3lame (MP3) -> the most legendary audio codec, highly compatible but less efficient than AAC.\n- libopus (OPUS) -> excellent for voice (VoIP) and interactive streaming, very low latency.\n- libvorbis (Vorbis) -> a free codec that is usually paired with WebM/VP8 video.\n- ac3 (AC3) -> the Dolby Digital standard commonly found in movies (DVD/Blu-ray).\n- pcm_s16le (PCM/WAV) -> raw audio without any compression whatsoever, very large but pure quality.",
  sampleRate_message:
    "🔢 <b>Sample Rate</b>\nSimply, sample rate is a FPS but for audio, it's defines how many audio samples are captured per second, measured in Hertz (Hz) or kHz.",
  playback_message:
    "⏩ <b>Playback Speed</b>\nPlayback speed is the speed at which audio or video content is played compared to its original speed.\n\nTechnically, playback speed determines how quickly data is read and rendered per unit of time. If you watch a video at 1.0x speed, it means that 1 second in the video is equal to 1 second in real time.\n\nCurrent: <code>{VALUE}</code>\nEnter a number if you want to change it (1-10) only.",
  saved_ops_message:
    "✅ <b>Done!</b>\nSuccessfully saved the option, return to the stream configuration to apply these changes.",
  loop_max_message: "⚠️ Stream loop option can only -1 to 10.",
  bmb_max_message: "⚠️ The option can only 2000 to 5000.",
  must_numb_message: "⚠️ Must be a number.",
  bitratev_low_message:
    "⚠️ It is not recommended that BitrateV value more than maxrate and bufsize value. Enter the number again if you still want to use it.",
  maxrate_low_message:
    "⚠️ It is not recommended that maxrate value less than BitrateV and more than bufsize value. Enter the number again if you still want to use it.",
  bufsize_low_message:
    "⚠️ It is not recommended that bufsize value less than BitrateV and maxrate value. Enter the number again if you still want to use it.",
  speed_max_message: "⚠️ Playback speed option can only 1 to 10.",
  change_detect_message:
    "🔔 <b>Notification</b>\nWe detected that you changed your stream configuration, do you want to apply it now or make other changes?\n\nℹ️ Restart is required to apply these changes.",
  abort_message:
    "⚠️ <b>Confirmation</b>\nIf you abort the stream, all of your stream data will be removed including all of your source and duration (configuration and stream key are saved). Use this if you stuck or want to start over.",
  abort_succ_message: "✅ <b>Done!</b>\nStream aborted.",
  yt_inv_message: "⚠️ Invalid YouTube url.",
  aborted_message: "⚠️ <b>Request Aborted</b>\nTook too long to respond.",
  config_message:
    "⚙️ <b>Configuration</b>\nHere some configuration that currently available",
  opt_unv_yt_message: "⚠️ This option is not available for this source.",
  checkyt_message: "📡 Checking YouTube source...",
  starting_ytconf_message:
    "🚀 <b>Starting stream, get ready...</b>\nconfiguring ffmpeg... {STATUS_F}\ncreating pipe for YouTube source... {STATUS_S}\nstarting ffmpeg... {STATUS_R}",
  starting_conf_message:
    "🚀 <b>Starting stream, get ready...</b>\nconfiguring ffmpeg... {STATUS_F}\ndownloading source... {STATUS_S}\nstarting ffmpeg... {STATUS_R}",
  stream_change_proc_message:
    "⚠️ A changes are being implemented, please wait...",
};
