var SpecificBread = require("../models/specificbreads");

// Display list of all Breads.
exports.specificbread_list = function (req, res, next) {
  SpecificBread.find()
    .populate("brand")
    .sort({ type: 1 })
    .exec(function (err, list_specificbreads) {
      if (err) {
        return next(err);
      }
      console.log(list_specificbreads);
      res.render("specificbread_list", {
        title: "All of our breads!",
        specificbreads_list: list_specificbreads,
      });
    });
};

// Display detail page for a specific Bread.
exports.specificbread_detail = function (req, res) {
  // Display detail page for a specific Bread.

  SpecificBread.find({ _id: req.params.id }).exec(function (err, results) {
    if (err) {
      return next(err);
    }
    // Successful, so render
    res.render("specificbread_detail", {
      title: "Your chosen bread",
      specificbread: results,
    });
  });
};

// Display Specific bread create form on GET.
exports.specificbread_create_get = function (req, res) {
  res.send("NOT IMPLEMENTED: Specific bread create GET");
};

// Handle Specific bread create on POST.
exports.specificbread_create_post = function (req, res) {
  res.send("NOT IMPLEMENTED: Specific bread create POST");
};

// Display Specific bread delete form on GET.
exports.specificbread_delete_get = function (req, res) {
  res.send("NOT IMPLEMENTED: Specific bread delete GET");
};

// Handle Specific bread delete on POST.
exports.specificbread_delete_post = function (req, res) {
  res.send("NOT IMPLEMENTED: Specific bread delete POST");
};

// Display Specific bread update form on GET.
exports.specificbread_update_get = function (req, res) {
  res.send("NOT IMPLEMENTED: Specific bread update GET");
};

// Handle Specific bread update on POST.
exports.specificbread_update_post = function (req, res) {
  res.send("NOT IMPLEMENTED: Specific bread update POST");
};
