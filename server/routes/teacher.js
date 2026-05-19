const router = require("express").Router();
const ctrl   = require("../controllers/teacherController");
const auth   = require("../middleware/auth");
const roles  = require("../middleware/roles");

router.use(auth, roles("teacher", "admin"));

router.get ("/submissions",                ctrl.getSubmissions);
router.get ("/stats",                      ctrl.stats);
router.post("/submissions/:submissionId/publish", ctrl.publishMarks);

module.exports = router;
