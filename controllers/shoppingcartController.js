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
      let grandTotalNoFormat = 0;
      results.forEach((bread) => {
        if (!bread.item.img) {
          bread.item.img = "default-bread-logo.jpg";
        }
        bread.itemTotal = bread.quantity * bread.item.price;
        bread.itemTotalFormatted = bread.itemTotal.toFixed(2);
        grandTotalNoFormat += bread.itemTotal;
        grandTotal = grandTotalNoFormat.toFixed(2);
      });
      res.render("shoppingcart", {
        shoppingcart: results,
        grandTotal: grandTotal,
      });
    });
};
