const router = require("express").Router();
const ctrl   = require("../controllers/studentController");
const auth   = require("../middleware/auth");
const roles  = require("../middleware/roles");

router.use(auth, roles("student"));

router.post("/submit",             ctrl.submit);
router.get ("/results",            ctrl.myResults);
router.get ("/results/:id",        ctrl.resultDetail);

module.exports = router;
