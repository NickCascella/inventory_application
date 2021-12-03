var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var SpecificBread = new Schema({
  type: { type: String, required: true },
  details: { type: String, required: true },
  brand: { type: Schema.Types.ObjectId, ref: "breadbrand", required: true },
  price: { type: Number, required: true, min: 1, max: 999 },
  quantity: { type: Number, required: true, min: 0 },
  instock: { type: Boolean, required: true },
  weight: { type: Number, required: true, min: 1 },
  moreInfo: { type: String },
});
// Virtual for individual breads URL
SpecificBread.virtual("url").get(function () {
  return "/catalog/specificbread/" + this._id;
});

//Export model
module.exports = mongoose.model("specificbread", SpecificBread);
