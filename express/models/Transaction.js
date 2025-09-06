// models/Transaction.js
const TransactionSchema = new mongoose.Schema({
  reference: {
    type: String,
    required: true,
    unique: true
  },
  merchant_ref: {
    type: String,
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  payment_method: {
    type: String,
    required: true
  },
  payment_name: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  fee: {
    type: Number,
    default: 0
  },
  total_amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['UNPAID', 'PAID', 'EXPIRED', 'FAILED', 'REFUNDED'],
    default: 'UNPAID'
  },
  payment_type: {
    type: String,
    enum: ['tripay', 'manual'],
    required: true
  },
  payment_code: String,
  qr_url: String,
  instructions: mongoose.Schema.Types.Mixed,
  created_at: {
    type: Date,
    default: Date.now
  },
  expired_at: Date,
  paid_at: Date
});