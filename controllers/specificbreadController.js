const SpecificBread = require("../models/specificbreads");
const BreadBrand = require("../models/breadbrands");
const CartItem = require("../models/cartitems");
const password = require("../password");
const { body, validationResult } = require("express-validator");
var async = require("async");
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

      res.render("specificbread_list", {
        title: "All of our breads!",
        specificbreads_list: list_specificbreads,
      });
    });
};

// Display detail page for a specific Bread.
exports.specificbread_detail = function (req, res) {
  SpecificBread.findById({ _id: req.params.id })
    .populate("brand")
    .exec(function (err, specificbread) {
      if (err) {
        return next(err);
      }
      // Successful, so render
      res.render("specificbread_detail", {
        title: "Your chosen bread",
        specificbread: specificbread,
      });
    });
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
      title: "Add a bread to a brand!",
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
          title: "Add your bread!",
          specificbread: specificbread,
          brandnames: arrayForSpecificBreadBrands,
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
      // Successful, so render.
      res.render("specificbread_delete", {
        title: "Delete this bread.",
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

        if (!errors.isEmpty()) {
          res.render("specificbread_delete", {
            title: `Unable to delete bread: ${results.brand.title} - ${results.type}`,
            specificbread: results,
            errors: errors,
          });
          return;
        } else {
          SpecificBread.findByIdAndRemove(
            req.body.specificbreadid,
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
      res.render("specificbread_form", {
        title: "Update your bread!",
        specificbread: results.specificbread,
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
    .escape(),
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
          title: "Issue with updating that bread..",
          specificbread: specificbread,
          brandnames: arrayForSpecificBreadBrands,
          errors: errors.array(),
        });
      });
    } else {
      // Data from form is valid.
      SpecificBread.findByIdAndUpdate(
        req.params.id,
        specificbread,
        {},
        function (err, thebread) {
          if (err) {
            return next(err);
          }
          // Successful - redirect to book detail page.
          res.redirect(thebread.url);
        }
      );
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
    if (duplicate.length === 0) {
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
          res.render(`shoppingcart`, {
            shoppingcart: results.loadcart,
          });
        }
      );
    } else {
      CartItem.find()
        .populate({
          path: "item",
          populate: {
            path: "brand",
          },
        })
        .exec(function (error, results) {
          if (error) {
            return next(error);
          }
          res.render("shoppingcart", {
            shoppingcart: results,
          });
        });
    }
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
      res.render("shoppingcart", {
        shoppingcart: results.updatedshoppingcart,
      });
    }
  );
};
