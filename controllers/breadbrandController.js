var BreadBrand = require("../models/breadbrands");
var SpecificBread = require("../models/specificbreads");
const password = require("../password");
const { body, validationResult } = require("express-validator");
var async = require("async");
const fs = require("fs");
const { promisify } = require("util");
const unlinkAsync = promisify(fs.unlink);

exports.index = function (req, res) {
  async.parallel(
    {
      breadbrand_count: function (callback) {
        BreadBrand.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
      },
      specificbread_count: function (callback) {
        SpecificBread.countDocuments({}, callback);
      },
    },
    function (err, results) {
      res.render("index", {
        title: "Nick's Bread's",
        error: err,
        data: results,
      });
    }
  );
};

// Display list of all Bread brands.
exports.breadbrand_list = function (req, res) {
  BreadBrand.find()
    .sort({ title: 1 })
    .exec(function (err, list_breadbrands) {
      if (err) {
        return next(err);
      }
      //Successful, so render
      list_breadbrands.forEach((brand) => {
        if (!brand.img) {
          brand.img = "default-brand-logo.jpg";
        }
      });
      res.render("breadbrand_list", {
        title: "Brands Offered Here",
        breadbrand_list: list_breadbrands,
      });
    });
};

// Display detail page for a specific Bread brand.
exports.breadbrand_detail = function (req, res, next) {
  // Display detail page for a specific Bread brand.
  async.parallel(
    {
      breadbrand: function (callback) {
        BreadBrand.findById(req.params.id).exec(callback);
      },

      specificbreads_with_brand: function (callback) {
        SpecificBread.find({ brand: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.breadbrand == null) {
        // No results.
        var err = new Error("Bread brand not found :(");
        err.status = 404;
        return next(err);
      }
      // Successful, so render
      if (!results.breadbrand.img) {
        results.breadbrand.img = "default-brand-logo.jpg";
      }
      res.render("breadbrand_detail", {
        title: "Bread Brand Details",
        breadbrand: results.breadbrand,
        specificbreads: results.specificbreads_with_brand,
      });
    }
  );
};

// Display Bread brand create form on GET.
exports.breadbrand_create_get = function (req, res) {
  res.render("breadbrand_form", {
    title: "Add a brand of bread!",
    passwordNeeded: false,
  });
};

// Handle Bread brand create on POST.
exports.breadbrand_create_post = [
  // Validate and santize the name field.
  body("title", "Brand name required - max 25 characters")
    .trim()
    .isLength({ min: 1, max: 25 })
    .escape(),
  body(
    "description",
    "A description for the bread must be set - max 150 characters"
  )
    .isLength({ min: 1, max: 150 })
    .trim()
    .escape(),
  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.

    const errors = validationResult(req);
    // Create a genre object with escaped and trimmed data.

    var breadbrand = new BreadBrand({
      title: req.body.title,
      description: req.body.description,
    });

    if (req.file) {
      breadbrand.img = req.file.filename;
    }

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("breadbrand_form", {
        title: "Unable to add your brand",
        breadbrand: breadbrand,
        passwordNeeded: false,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.
      BreadBrand.findOne({
        title: req.body.title,
      }).exec(function (err, found_same_bread) {
        if (err) {
          return next(err);
        }
        if (found_same_bread) {
          // Bread exists, redirect to its detail page.
          res.redirect(found_same_bread.url);
        } else {
          breadbrand.save(function (err) {
            if (err) {
              return next(err);
            }
            // Bread saved. Redirect to bread detail page.
            res.redirect(breadbrand.url);
          });
        }
      });
    }
  },
];

// Display Bread brand delete form on GET.
exports.breadbrand_delete_get = function (req, res, next) {
  BreadBrand.findById(req.params.id).exec(function (err, results) {
    if (err) {
      return next(err);
    }
    if (results === null) {
      // No results.
      res.redirect("/catalog/breadbrands");
    }
    if (!results.img) {
      results.img = "default-brand-logo.jpg";
    }
    // Successful, so render.
    res.render("breadbrand_delete", {
      title: "Delete this brand?",
      passwordNeeded: true,
      breadbrand: results,
    });
  });
};

// Handle Bread brand delete on POST.
exports.breadbrand_delete_post = [
  body("password", "Incorrect Password").trim().escape().equals(password),
  (req, res, next) => {
    const errors = validationResult(req);

    BreadBrand.findById(req.params.id).exec((err, resultsOne) => {
      if (err) {
        return next(err);
      }
      if (!resultsOne.img) {
        resultsOne.img = "default-brand-logo.jpg";
      }

      if (!errors.isEmpty()) {
        res.render("breadbrand_delete", {
          title: "Unable to delete brand",
          breadbrand: resultsOne,
          passwordNeeded: true,
          errors: errors.array(),
        });
        return;
      }

      if (
        resultsOne.img &&
        resultsOne.img !== "default-brand-logo.jpg" &&
        resultsOne.img !== "default-bread-logo.jpg"
      ) {
        unlinkAsync(`./public/images/${resultsOne.img}`);
      }

      async.parallel(
        {
          breadbrand: function (callback) {
            BreadBrand.findByIdAndRemove(req.params.id).exec(callback);
          },
          specificbread: function (callback) {
            SpecificBread.deleteMany({ brand: req.params.id }).exec(callback);
          },
        },
        function (err) {
          if (err) {
            return next(err);
          }
          res.redirect("/catalog/breadbrands");
        }
      );
    });
  },
];

// Display Bread brand update form on GET.
exports.breadbrand_update_get = function (req, res, next) {
  BreadBrand.findById(req.params.id).exec(function (err, results) {
    if (err) {
      return next(err);
    }
    res.render("breadbrand_form", {
      title: "Update a brand of bread",
      passwordNeeded: true,
      breadbrand: results,
    });
  });
};

// Handle Bread brand update on POST.
exports.breadbrand_update_post = [
  // Validate and santize the name field.
  body("title", "Need a proper bread brand name - max 25 characters")
    .isLength({ min: 1, max: 25 })
    .trim()
    .escape(),
  body(
    "description",
    "A proper description of the brand must be set - max 150 characters"
  )
    .trim()
    .isLength({ min: 1, max: 150 })
    .escape(),
  body("password", "Incorrect password").trim().escape().equals(password),
  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    // Create a genre object with escaped and trimmed data.
    var breadbrand = new BreadBrand({
      _id: req.params.id,
      title: req.body.title,
      description: req.body.description,
    });

    if (req.file !== undefined) {
      breadbrand.img = req.file.filename;
    }

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("breadbrand_form", {
        title: "Unable to update your brand",
        breadbrand: breadbrand,
        passwordNeeded: true,
        errors: errors.array(),
      });
    } else {
      // Data from form is valid.
      BreadBrand.findById(req.params.id).exec(function (err, result) {
        if (err) {
          return nexr(err);
        }
        if (result.img && req.file) {
          unlinkAsync(`./public/images/${result.img}`);
        }
        BreadBrand.findByIdAndUpdate(
          req.params.id,
          breadbrand,
          {},
          function (err, thebrand) {
            if (err) {
              return next(err);
            }
            res.redirect(thebrand.url);
          }
        );
      });
    }
  },
];
