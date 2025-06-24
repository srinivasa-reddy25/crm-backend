const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;




const CompanySchema = mongoose.Schema({
    name: { type: String, required: true },
    industry: String,
    website: String,
    address: String,
    phone: String,
    email: String,
    description: String,
    createdBy: { type: ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: Date
});


CompanySchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
}
);

CompanySchema.index({ name: 1, createdBy: 1 }, { unique: true });


const Company = mongoose.models.Company || mongoose.model("Company", CompanySchema);

// const Company = mongoose.model("Company", CompanySchema);

module.exports = { Company };
