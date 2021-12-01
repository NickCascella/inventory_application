var express = require("express");
var router = express.Router();

// Require controller modules.
var breadbrand_controller = require("../controllers/breadbrandController");
var specificbread_controller = require("../controllers/specificbreadController");

/// BOOK ROUTES ///

// GET catalog home page.
router.get("/", breadbrand_controller.index);

// GET request for creating a breadbrand. NOTE This must come before routes that display breadbrand (uses id).
router.get("/breadbrand/create", breadbrand_controller.breadbrand_create_get);

// POST request for creating breadbrand.
router.post("/breadbrand/create", breadbrand_controller.breadbrand_create_post);

// GET request to delete breadbrand.
router.get(
  "/breadbrand/:id/delete",
  breadbrand_controller.breadbrand_delete_get
);

// POST request to delete breadbrand.
router.post(
  "/breadbrand/:id/delete",
  breadbrand_controller.breadbrand_delete_post
);

// GET request to update breadbrand.
router.get(
  "/breadbrand/:id/update",
  breadbrand_controller.breadbrand_update_get
);

// POST request to update breadbrand.
router.post(
  "/breadbrand/:id/update",
  breadbrand_controller.breadbrand_update_post
);

// GET request for one breadbrand.
router.get("/breadbrand/:id", breadbrand_controller.breadbrand_detail);

// GET request for list of all breadbrand items.
router.get("/breadbrands", breadbrand_controller.breadbrand_list);

/// specificbread ROUTES ///

// GET request for creating specificbread. NOTE This must come before route for id (i.e. display specificbread).
router.get(
  "/specificbread/create",
  specificbread_controller.specificbread_create_get
);

// POST request for creating specificbread.
router.post(
  "/specificbread/create",
  specificbread_controller.specificbread_create_post
);

// GET request to delete specificbread.
router.get(
  "/specificbread/:id/delete",
  specificbread_controller.specificbread_delete_get
);

// POST request to delete specificbread.
router.post(
  "/specificbread/:id/delete",
  specificbread_controller.specificbread_delete_post
);

// GET request to update specificbread.
router.get(
  "/specificbread/:id/update",
  specificbread_controller.specificbread_update_get
);

// POST request to update specificbread.
router.post(
  "/specificbread/:id/update",
  specificbread_controller.specificbread_update_post
);

// GET request for one specificbread.
router.get("/specificbread/:id", specificbread_controller.specificbread_detail);

// GET request for list of all specificbreads.
router.get("/specificbreads", specificbread_controller.specificbread_list);

module.exports = router;
