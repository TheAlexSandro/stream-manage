import mongoose, { Schema, Model, InferSchemaType } from "mongoose";
import type { UserDB } from "../../types/type";

const uri = process.env["MONGODB_URI"] as string;
mongoose.connect(uri, {
  dbName: String(process.env["DB_NAME"]),
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

const userSchema = new Schema({
  id: { type: String, required: true },
  stream_list: { type: String, default: null },
  is_premium: { type: Boolean, default: false },
  stream_loop: { type: String, default: "0" },
  stream_fps: { type: String, default: "30" },
  stream_video_codec: { type: String, default: "libx264" },
  stream_preset: { type: String, default: "ultrafast" },
  stream_bitratev: { type: String, default: "2500" },
  stream_bitratea: { type: String, default: "128k" },
  stream_maxrate: { type: String, default: "3000" },
  stream_bufsize: { type: String, default: "5000" },
  stream_tune: { type: String, default: "zerolatency" },
  stream_audio_codec: { type: String, default: "aac" },
  stream_sample_rate: { type: String, default: "48000" },
  stream_playback_speed: { type: String, default: "1" },
});

type UserSchema = InferSchemaType<typeof userSchema>;

type Collection = "user";
type Callback<T> = (error: null | string, result: T | null) => void;

const userDB: Model<UserSchema> = mongoose.model<UserSchema>(
  "user",
  userSchema,
);

const getModel = (collection: Collection): Model<any> => {
  switch (collection) {
    case "user":
      return userDB;
    default:
      return userDB;
  }
};

export class Database {
  static add(
    collection: Collection,
    identifier: string,
    callback?: Callback<boolean | string> | null,
  ): void {
    const filter = { id: identifier };

    this.get(collection, "id", identifier, (error, result) => {
      if (error) return callback?.(error, null);
      if (result) return;

      const data = new userDB(filter);
      data
        .save()
        .then(() => {
          return callback?.(null, true);
        })
        .catch((err: any) => {
          console.log(err);
          return callback?.(err.message, null);
        });
    });
  }

  static get(
    collection: Collection,
    field_identifier: string,
    identifier: string | number,
    callback: Callback<boolean | string | any>,
  ): void {
    const model = getModel(collection);

    model
      .findOne({ [field_identifier]: String(identifier) }, { _id: 0 })
      .then((result) => {
        if (!result) return callback(null, null);
        return callback(null, result);
      });
  }

  static edit(
    collection: Collection,
    field_identifier: string,
    identifier: string | number,
    field: string,
    new_value: any,
    callback?: Callback<boolean | string | object>,
  ): void {
    const model = getModel(collection);

    model
      .findOne({ [field_identifier]: String(identifier) })
      .then((result: any) => {
        if (!result) return callback?.(null, false);
        if (typeof result[field] === "undefined")
          return callback?.(null, false);

        result[field] = new_value;

        return result.save();
      })
      .then(() => {
        callback?.(null, true);
      })
      .catch((err: Error) => {
        console.log(err);
        callback?.(err.message, null);
      });
  }

  static remove(
    collection: Collection,
    field_identifier: string,
    identifier: string,
    callback?: Callback<boolean | string>,
  ): void {
    const model = getModel(collection);
    model
      .deleteOne({ [field_identifier]: identifier })
      .then(() => callback?.(null, true))
      .catch((err: Error) => callback?.(err.message, null));
  }
}
