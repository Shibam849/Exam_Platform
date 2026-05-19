const router = require("express").Router();
const ctrl   = require("../controllers/aiController");
const auth   = require("../middleware/auth");
const roles  = require("../middleware/roles");

router.use(auth);

// Teacher / Admin: generate feedback
router.post("/feedback/:submissionId",           roles("teacher","admin"), ctrl.generateFeedback);
router.post("/feedback/bulk/:examId",            roles("teacher","admin"), ctrl.bulkGenerateFeedback);

// Any authenticated user: view feedback
router.get ("/feedback/:submissionId",           ctrl.getFeedback);

module.exports = router;
