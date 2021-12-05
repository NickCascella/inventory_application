var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var BreadBrand = new Schema({
  title: { type: String, required: true, maxlength: 10 },
  description: { type: String, required: true },
  img: { type: String },
});
// Virtual for individual breads URL
BreadBrand.virtual("url").get(function () {
  return "/catalog/breadbrand/" + this._id;
});

//Export model
module.exports = mongoose.model("breadbrand", BreadBrand);
