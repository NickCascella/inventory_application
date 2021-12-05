const SpecificBread = require("../models/specificbreads");
const BreadBrand = require("../models/breadbrands");
const CartItem = require("../models/cartitems");

exports.view_cart = function (req, res, next) {
  CartItem.find()
    .populate({
      path: "item",
      populate: {
        path: "brand",
      },
    })
    .sort({ item: 1 })
    .exec(function (err, results) {
      if (err) {
        return next(err);
      }
      res.render("shoppingcart", { shoppingcart: results });
    });
};
