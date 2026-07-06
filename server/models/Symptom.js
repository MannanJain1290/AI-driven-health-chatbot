import mongoose from 'mongoose';

const symptomSchema = new mongoose.Schema({
  symptom: { type: String, required: true },
  sessionId: { type: String, required: true },
  date: { type: String, required: true },
}, { timestamps: true });

const Symptom = mongoose.model('Symptom', symptomSchema);
export default Symptom;
