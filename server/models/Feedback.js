import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  query: { type: String, required: true },
  answer: { type: String, required: true },
  rating: { type: Number, required: true, enum: [0, 1] },
  comment: { type: String, default: '' },
}, { timestamps: true });

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;
