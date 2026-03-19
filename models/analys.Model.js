const mongoose = require('mongoose');


const analysSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, unique: true },
    basicStats: { total: Number, completed: Number, pending: Number, completionPercentage: Number },
    progressScore: { score: Number, completionComponent: Number, streakComponent: Number, consistencyComponent: Number, consistencyRate: Number },
    dailyTreads: [{ date: String, label: String, count: Number }],
    weeklyTreads: [{ weekStart: String, label: String, count: Number }],
    improveTread: { trend: String, message: String, icon: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('analys', analysSchema);