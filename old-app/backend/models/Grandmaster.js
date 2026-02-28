import mongoose from "mongoose";

const grandmasterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    thumbnail: {
        type: String,
        default: null,
    },
    description: {
        type: String,
        default: "",
    },
}, { timestamps: true });

export default mongoose.model("Grandmaster", grandmasterSchema);
