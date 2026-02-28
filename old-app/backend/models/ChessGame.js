import mongoose from "mongoose";

const chessGameSchema = new mongoose.Schema({
  whitePlayer: { type: String, required: true },
  blackPlayer: { type: String, required: true },
  event: { type: String, default: "" },
  year: Number,

  result: { type: String, default: "*" },
  pgn: { type: String, default: "" },
});

export default mongoose.model("ChessGame", chessGameSchema);
