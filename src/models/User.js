import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required.'], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email.'],
    },
    phone: { type: String, trim: true, maxlength: 20 },
    // Length is checked on the plain text (validation runs before the hashing hook); bcrypt only reads 72 bytes.
    password: {
      type: String,
      required: true,
      minlength: [8, 'Password must be at least 8 characters.'],
      maxlength: [72, 'Password must be at most 72 characters.'],
      select: false,
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isActive: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

userSchema.pre('save', async function hashPassword() {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
  // Changing password, role or active state invalidates every token issued before.
  if (!this.isNew && this.isModified('password role isActive')) this.tokenVersion = (this.tokenVersion ?? 0) + 1;
});

userSchema.methods.matchPassword = function matchPassword(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toPublic = function toPublic() {
  const { _id, name, email, phone, role, isActive, createdAt } = this;
  return { _id, name, email, phone, role, isActive, createdAt };
};

export default mongoose.model('User', userSchema);
