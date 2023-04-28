const exprss = require("express");
const {
  registerUser,
  currentUser,
  loginUser,
} = require("../controllers/userController");
const validateToken = require("../middleware/validateTokenHandler");
const router = express.Router();

router.post("/register", registerUser);
router.port("/login", loginUser);
router.get("/current", validateToken, currentUser);

module.exports = router;
