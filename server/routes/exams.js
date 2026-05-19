const router = require("express").Router();
const ctrl   = require("../controllers/examController");
const auth   = require("../middleware/auth");
const roles  = require("../middleware/roles");

router.use(auth);

// Teacher
router.post  ("/",             roles("teacher"),        ctrl.create);
router.get   ("/my",           roles("teacher"),        ctrl.teacherExams);
router.put   ("/:id",          roles("teacher"),        ctrl.update);
router.delete("/:id",          roles("teacher"),        ctrl.remove);

// Student
router.get   ("/available",    roles("student"),        ctrl.available);
router.get   ("/:id/start",    roles("student"),        ctrl.start);

// Shared
router.get   ("/:id",          roles("teacher","admin","student"), ctrl.view);

// Admin
router.get   ("/admin/all",    roles("admin"),          ctrl.adminAll);
router.delete("/admin/:id",    roles("admin"),          ctrl.adminDelete);
router.patch ("/admin/:id/publish", roles("admin"),     require("../controllers/adminController").toggleExamPublish);

module.exports = router;
