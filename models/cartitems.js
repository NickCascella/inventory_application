const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CartItem = new Schema({
  item: { type: Schema.Types.ObjectId, ref: "specificbread", required: true },
  quantity: { type: Number, required: true, min: 1 },
});
// Virtual for individual breads URL
CartItem.virtual("url").get(function () {
  return "/catalog/specificbread/" + this.item;
});

//Export model
module.exports = mongoose.model("cartitem", CartItem);
