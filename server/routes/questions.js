const router = require("express").Router();
const ctrl   = require("../controllers/questionController");
const auth   = require("../middleware/auth");
const roles  = require("../middleware/roles");

router.use(auth);

router.get   ("/",         roles("teacher"),         ctrl.list);
router.post  ("/",         roles("teacher"),         ctrl.create);
router.put   ("/:id",      roles("teacher"),         ctrl.update);
router.delete("/:id",      roles("teacher"),         ctrl.remove);
router.get   ("/all",      roles("admin"),           ctrl.adminList);

module.exports = router;
