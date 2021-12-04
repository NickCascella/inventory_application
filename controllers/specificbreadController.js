var SpecificBread = require("../models/specificbreads");
var BreadBrand = require("../models/breadbrands");
const password = require("../password");
const { body, validationResult } = require("express-validator");

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
  // async.parallel(
  //   {
  //     specificbreads: function (callback) {
  //       SpecificBread.find().populate("brand").exec(callback);
  //     },
  //     breadbrands: function (callback) {
  //       BreadBrands.find(callback);
  //     },
  //   },
  //   function (err, results) {
  //     if (err) {
  //       return next(err);
  //     }
  //     res.render("book_form", {
  //       title: "Create Book",
  //       authors: results.authors,
  //       genres: results.genres,
  //     });
  //   }
  // );

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
    console.log(titles);
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
  body("details", "A description for the bread must be set").trim().escape(),
  body("quantity", "An amount must be set").trim().escape(),
  body("price", "A price must be set").trim().escape(),
  body("weight", "A weight must be set, in grams").trim().escape(),
  body("moreInfo", "A proper url must be set")
    .optional({ checkFalsy: true })
    .trim()
    .escape(),
  body("password", "A proper password must be set").trim().escape(),

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

    if (!errors.isEmpty() || req.body.password !== password) {
      // There are errors. Render the form again with sanitized values/error messages.

      SpecificBread.find()
        .populate("brand")
        .exec(function (err, specificbreadforlist) {
          if (err) {
            return next(err);
          }

          let arrayForSpecificBreadBrands = [];
          let titles = [];
          specificbreadforlist.map((specificbreadObj) => {
            if (!titles.includes(specificbreadObj.brand.title)) {
              titles.push(specificbreadObj.brand.title);
              arrayForSpecificBreadBrands.push(specificbreadObj);
            }
          });

          res.render("specificbread_form", {
            title: "Add your bread!",
            specificbread: specificbread,
            brandnames: arrayForSpecificBreadBrands,
            errors: errors.array(),
          });
          return;
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
exports.specificbread_delete_post = function (req, res, next) {
  body("password", "A proper password must be set").trim().escape();
  SpecificBread.findById(req.params.id)
    .populate("brand")
    .exec(function (err, results) {
      if (err) {
        return next(err);
      }
      if (req.body.password === password) {
        SpecificBread.findByIdAndRemove(
          req.body.specificbreadid,
          function deleteSpecificBread(err) {
            if (err) {
              return next(err);
            }
            // Success - go to author list
            res.redirect("/catalog/specificbreads");
          }
        );
      } else {
        const errors = {
          incorrectPassword: "Incorrect Password",
        };
        res.render("specificbread_delete", {
          title: "Delete this bread.",
          specificbread: results,
          errors: errors,
        });
      }
    });
};

// Display Specific bread update form on GET.
exports.specificbread_update_get = function (req, res) {
  res.send("NOT IMPLEMENTED: Specific bread update GET");
};

// Handle Specific bread update on POST.
exports.specificbread_update_post = function (req, res) {
  res.send("NOT IMPLEMENTED: Specific bread update POST");
};
