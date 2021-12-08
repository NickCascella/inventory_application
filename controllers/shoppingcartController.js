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
      let grandTotal = 0;
      results.forEach((bread) => {
        if (!bread.img) {
          bread.img = "default-bread-logo.jpg";
        }
        bread.itemTotal = bread.quantity * bread.item.price;
        grandTotal += bread.itemTotal;
      });
      res.render("shoppingcart", {
        shoppingcart: results,
        grandTotal: grandTotal,
      });
    });
};
