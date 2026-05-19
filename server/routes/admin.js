const router = require("express").Router();
const ctrl   = require("../controllers/adminController");
const auth   = require("../middleware/auth");
const roles  = require("../middleware/roles");

router.use(auth, roles("admin"));

router.get   ("/summary",            ctrl.summary);
router.get   ("/analytics",          ctrl.analytics);
router.get   ("/users",              ctrl.getUsers);
router.get   ("/users/:id",          ctrl.getUserById);
router.post  ("/users",              ctrl.createUser);
router.put   ("/users/:id",          ctrl.updateUser);
router.patch ("/users/:id/toggle",   ctrl.toggleUserStatus);
router.delete("/users/:id",          ctrl.deleteUser);
router.get   ("/submissions",        ctrl.getSubmissions);
router.get   ("/ai-feedbacks",       ctrl.getAiFeedbacks);

module.exports = router;
