import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  subject_id: {
    type: String,
    unique: true
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  materials: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material'
  }],
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, { timestamps: true });

subjectSchema.pre('save', function (next) {
  if (!this.subject_id && this.name && this.course_id) {
    const namePart = this.name.substring(0, 2).toUpperCase();
    const courseIdStr = this.course_id.toString();
    const courseIdPart = courseIdStr.slice(-3).toUpperCase();

    const now = new Date();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const year = now.getFullYear().toString().slice(-2);

    this.subject_id = `SUB-${namePart}${courseIdPart}-${minutes}${year}`;
  }
  next();
});

const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;
