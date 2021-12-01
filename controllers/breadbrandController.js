var BreadBrand = require("../models/breadbrands");
var SpecificBread = require("../models/specificbreads");

var async = require("async");

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
      console.log(results);
      res.render("index", {
        title: "Bread.",
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

      res.render("breadbrand_list", {
        title: "List of bread brands",
        breadbrand_list: list_breadbrands,
      });
    });
};

// Display detail page for a specific Bread brand.
exports.breadbrand_detail = function (req, res) {
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
  res.send("NOT IMPLEMENTED: Bread brand create GET");
};

// Handle Bread brand create on POST.
exports.breadbrand_create_post = function (req, res) {
  res.send("NOT IMPLEMENTED: Bread brand create POST");
};

// Display Bread brand delete form on GET.
exports.breadbrand_delete_get = function (req, res) {
  res.send("NOT IMPLEMENTED: Bread brand delete GET");
};

// Handle Bread brand delete on POST.
exports.breadbrand_delete_post = function (req, res) {
  res.send("NOT IMPLEMENTED: Bread brand delete POST");
};

// Display Bread brand update form on GET.
exports.breadbrand_update_get = function (req, res) {
  res.send("NOT IMPLEMENTED: Bread brand update GET");
};

// Handle Bread brand update on POST.
exports.breadbrand_update_post = function (req, res) {
  res.send("NOT IMPLEMENTED: Bread brand update POST");
};
