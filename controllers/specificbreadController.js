const SpecificBread = require("../models/specificbreads");
const BreadBrand = require("../models/breadbrands");
const CartItem = require("../models/cartitems");
const password = require("../password");
const { body, validationResult } = require("express-validator");
const async = require("async");
const fs = require("fs");
const { promisify } = require("util");
const unlinkAsync = promisify(fs.unlink);

// Display list of all Breads.
exports.specificbread_list = function (req, res, next) {
  SpecificBread.find()
    .populate("brand")
    .sort({ type: 1 })
    .exec(function (err, list_specificbreads) {
      if (err) {
        return next(err);
      }
      list_specificbreads.forEach((bread) => {
        if (!bread.img) {
          bread.img = "default-bread-logo.jpg";
        }
      });
      res.render("specificbread_list", {
        title: "All of our breads",
        specificbreads_list: list_specificbreads,
      });
    });
};

// Display detail page for a specific Bread.
exports.specificbread_detail = function (req, res, next) {
  async.series(
    {
      specificbread: function (callback) {
        SpecificBread.findById({ _id: req.params.id })
          .populate("brand")
          .exec(callback);
      },
      cartItem: function (callback) {
        CartItem.find({ item: req.params.id })
          .populate({
            path: "item",
            populate: {
              path: "brand",
            },
          })
          .exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (!results.specificbread.img) {
        results.specificbread.img = "default-bread-logo.jpg";
      }

      res.render("specificbread_detail", {
        title: "Your chosen bread",
        specificbread: results.specificbread,
        inCart: results.cartItem[0],
      });
    }
  );
};

// Display Specific bread create form on GET.
exports.specificbread_create_get = function (req, res) {
  BreadBrand.find().exec(function (err, breadbrand) {
    if (err) {
      return next(err);
    }
    let arrayForSpecificBreadBrands = [];
    let titles = [];
    breadbrand.map((breadbrand) => {
      if (!titles.includes(breadbrand.title)) {
        titles.push(breadbrand.title);
        arrayForSpecificBreadBrands.push(breadbrand);
      }
    });

    res.render("specificbread_form", {
      title: "Add a bread to a brand",
      passwordNeeded: false,
      brandnames: arrayForSpecificBreadBrands,
    });
  });
};

// Handle Specific bread create on POST.
exports.specificbread_create_post = [
  // Validate and santize the name field.
  body("type", "Bread type required").trim().isLength({ min: 1 }).escape(),
  body("details", "A description for the bread must be set")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("quantity", "Availible amount of stock must be set (min: 1, max: 100)")
    .trim()
    .isInt({ min: 1, max: 100 })
    .escape(),
  body("price", "A price must be set")
    .trim()
    .isFloat({ min: 1, max: 1000000 })
    .escape(),
  body("weight", "A weight must be set, in grams")
    .trim()
    .isInt({ min: 1, max: 10000 })
    .escape(),
  body("moreInfo", "A proper url must be set")
    .optional({ checkFalsy: true })
    .trim()
    .escape(),
  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    if (req.body.instock === "on") {
      req.body.instock = true;
    } else {
      req.body.instock = false;
    }

    // Create a genre object with escaped and trimmed data.
    var specificbread = new SpecificBread({
      type: req.body.type,
      details: req.body.details,
      instock: req.body.instock,
      quantity: req.body.quantity,
      brand: req.body.brand,
      price: req.body.price,
      weight: req.body.weight,
      moreInfo: req.body.moreInfo,
    });

    if (req.file !== undefined) {
      specificbread.img = req.file.filename;
    }

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.

      BreadBrand.find().exec(function (err, breadbrand) {
        if (err) {
          return next(err);
        }
        let arrayForSpecificBreadBrands = [];
        let titles = [];
        breadbrand.map((breadbrand) => {
          if (!titles.includes(breadbrand.title)) {
            titles.push(breadbrand.title);
            arrayForSpecificBreadBrands.push(breadbrand);
          }
        });
        res.render("specificbread_form", {
          title: "Add your bread",
          specificbread: specificbread,
          brandnames: arrayForSpecificBreadBrands,
          passwordNeeded: false,
          errors: errors.array(),
        });
      });
    } else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      SpecificBread.findOne({
        type: req.body.type,
        brand: req.body.brand,
      }).exec(function (err, found_same_bread) {
        if (err) {
          return next(err);
        }
        if (found_same_bread) {
          // Bread exists, redirect to its detail page.
          res.redirect(found_same_bread.url);
        } else {
          specificbread.save(function (err) {
            if (err) {
              return next(err);
            }
            // Bread saved. Redirect to bread detail page.
            res.redirect(specificbread.url);
          });
        }
      });
    }
  },
];

// Display Specific bread delete form on GET.
exports.specificbread_delete_get = function (req, res, next) {
  SpecificBread.findById(req.params.id)
    .populate("brand")
    .exec(function (err, results) {
      if (err) {
        return next(err);
      }
      if (results === null) {
        // No results.
        res.redirect("/catalog/specificbreads");
      }
      if (!results.img) {
        results.img = "default-bread-logo.jpg";
      }
      // Successful, so render.
      res.render("specificbread_delete", {
        title: "Delete this bread?",
        passwordNeeded: true,
        specificbread: results,
      });
    });
};

// Handle Specific bread delete on POST.
exports.specificbread_delete_post = [
  body("password", "Incorrect password").trim().escape().equals(password),
  (req, res, next) => {
    SpecificBread.findById(req.params.id)
      .populate("brand")
      .exec(function (err, results) {
        if (err) {
          return next(err);
        }
        const errors = validationResult(req);

        if (
          results.img &&
          results.img !== "default-brand-logo.jpg" &&
          results.img !== "default-bread-logo.jpg"
        ) {
          unlinkAsync(`./public/images/${results.img}`);
        }

        if (!errors.isEmpty()) {
          res.render("specificbread_delete", {
            title: `Unable to delete bread: ${results.brand.title} - ${results.type}`,
            specificbread: results,
            passwordNeeded: true,
            errors: errors,
          });
          return;
        } else {
          SpecificBread.findByIdAndRemove(
            req.params.id,
            function deleteSpecificBread(err) {
              if (err) {
                return next(err);
              }
              res.redirect("/catalog/specificbreads");
            }
          );
        }
      });
  },
];

// Display Specific bread update form on GET.
exports.specificbread_update_get = function (req, res) {
  async.parallel(
    {
      specificbread: function (callback) {
        SpecificBread.findById(req.params.id).populate("brand").exec(callback);
      },
      breadbrand: function (callback) {
        BreadBrand.find().exec(callback);
      },
    },

    function (err, results) {
      if (err) {
        return next(err);
      }

      if (results.specificbread == null) {
        // No results.
        var err = new Error("Bread not found");
        err.status = 404;
        return next(err);
      }
      // Success.
      let arrayForSpecificBreadBrands = [];
      let titles = [];
      results.breadbrand.map((breadbrand) => {
        if (!titles.includes(breadbrand.title)) {
          titles.push(breadbrand.title);
          arrayForSpecificBreadBrands.push(breadbrand);
        }
      });
      let priceInt = parseInt(results.specificbread.price);
      console.log(results.specificbread);
      res.render("specificbread_form", {
        title: "Update your bread",
        specificbread: results.specificbread,
        price: priceInt,
        passwordNeeded: true,
        brandnames: arrayForSpecificBreadBrands,
      });
    }
  );
};

// Handle Specific bread update on POST.
exports.specificbread_update_post = [
  // Validate and santize the name field.
  body("type", "Bread type required").trim().isLength({ min: 1 }).escape(),
  body("details", "A description for the bread must be set")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("quantity", "Availible amount of stock must be set (min: 1, max: 100)")
    .trim()
    .isInt({ min: 1, max: 100 })
    .escape(),
  body("price", "A price must be set (min: $1.00, max: $1,000,000.00)")
    .trim()
    .isFloat({ min: 1, max: 1000000 })
    .escape(),
  body("weight", "A weight must be set, in grams")
    .trim()
    .isInt({ min: 1, max: 10000 })
    .escape(),
  body("moreInfo", "A proper url must be set")
    .optional({ checkFalsy: true })
    .trim()
    .isURL(),
  body("password", "Incorrect password").trim().escape().equals(password),
  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    if (req.body.instock === "on") {
      req.body.instock = true;
    } else {
      req.body.instock = false;
    }
    // Create a genre object with escaped and trimmed data.
    var specificbread = new SpecificBread({
      _id: req.params.id,
      type: req.body.type,
      details: req.body.details,
      instock: req.body.instock,
      quantity: req.body.quantity,
      brand: req.body.brand,
      price: req.body.price,
      weight: req.body.weight,
      moreInfo: req.body.moreInfo,
    });

    if (req.file !== undefined) {
      specificbread.img = req.file.filename;
    }

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      BreadBrand.find().exec(function (err, breadbrand) {
        if (err) {
          return next(err);
        }
        let arrayForSpecificBreadBrands = [];
        let titles = [];
        breadbrand.map((breadbrand) => {
          if (!titles.includes(breadbrand.title)) {
            titles.push(breadbrand.title);
            arrayForSpecificBreadBrands.push(breadbrand);
          }
        });
        const priceInt = parseInt(specificbread.price);
        res.render("specificbread_form", {
          title: "Unable to update bread",
          specificbread: specificbread,
          brandnames: arrayForSpecificBreadBrands,
          price: priceInt,
          passwordNeeded: true,
          errors: errors.array(),
        });
      });
    } else {
      SpecificBread.findById(req.params.id).exec(function (err, result) {
        if (err) {
          return next(err);
        }
        if (result.img && req.file) {
          unlinkAsync(`./public/images/${result.img}`);
        }
        SpecificBread.findByIdAndUpdate(
          req.params.id,
          specificbread,
          {},
          function (err, thebread) {
            if (err) {
              return next(err);
            }
            res.redirect(thebread.url);
          }
        );
      });
    }
  },
];

exports.specificbread_add_to_cart = function (req, res, next) {
  const cartitem = new CartItem({
    item: req.params.id,
    quantity: req.body.quantity,
  });

  CartItem.find({ item: req.params.id }).exec(function (err1, duplicate) {
    if (err1) {
      return next(err1);
    }
    if (duplicate.length !== 0) {
      CartItem.findOneAndDelete({ item: req.params.id }).exec(
        (err2, resultsTwo) => {
          if (err2) {
            return next(err2);
          }
          cartitem._id = duplicate[0]._id;
        }
      );
    }
    async.series(
      {
        cartitem: function (callback) {
          cartitem.save(callback);
        },
        loadcart: function (callback) {
          CartItem.find()
            .populate({
              path: "item",
              populate: {
                path: "brand",
              },
            })
            .exec(callback);
        },
      },
      function (err, results) {
        if (err) {
          return next(err);
        }
        let grandTotal = 0;
        let grandTotalNoFormat = 0;
        results.loadcart.forEach((item) => {
          if (!item.item.img) {
            item.item.img = "default-bread-logo.jpg";
          }

          item.itemTotal = item.quantity * item.item.price;
          item.itemTotalFormatted = item.itemTotal.toFixed(2);

          console.log(item.itemTotalFormatted);
          grandTotalNoFormat += item.itemTotal;
          grandTotal = grandTotalNoFormat.toFixed(2);
        });
        res.render(`shoppingcart`, {
          shoppingcart: results.loadcart,
          grandTotal: grandTotal,
        });
      }
    );
  });
};

exports.specificbread_remove_from_cart = function (req, res, next) {
  async.series(
    {
      removeitem: function (callback) {
        CartItem.findByIdAndRemove(req.params.id).exec(callback);
      },
      updatedshoppingcart: function (callback) {
        CartItem.find()
          .populate({
            path: "item",
            populate: {
              path: "brand",
            },
          })
          .exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      let grandTotalNoFormat = 0;
      let grandTotal = 0;
      results.updatedshoppingcart.forEach((item) => {
        if (!item.item.img) {
          item.item.img = "default-bread-logo.jpg";
        }
        item.itemTotal = item.quantity * item.item.price;
        item.itemTotalFormatted = item.itemTotal.toFixed(2);

        console.log(item.itemTotalFormatted);
        grandTotalNoFormat += item.itemTotal;
        grandTotal = grandTotalNoFormat.toFixed(2);
      });
      console.log(grandTotal);
      res.render("shoppingcart", {
        shoppingcart: results.updatedshoppingcart,
        grandTotal: grandTotal,
      });
    }
  );
};
