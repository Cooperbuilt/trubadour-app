const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const commentController = require('../controllers/commentController');
const { catchErrors } = require('../handlers/errorHandlers');

// For route protection, first use authController.isLoggedIn

// Do work here
router.get('/', catchErrors(storeController.getPoems));
router.get('/poems', catchErrors(storeController.getPoems));
router.get('/poems/page/:page', catchErrors(storeController.getPoems));
router.get('/add', authController.isLoggedIn, storeController.addPoem);
// catchErrors is a higher order function to handle the asynchronous call to mongo
router.post('/add', catchErrors(storeController.createPoem));
router.post('/add/:id', catchErrors(storeController.updatePoem));

router.get('/poems/:id/edit', catchErrors(storeController.editPoem));
router.get('/poems/:slug', catchErrors(storeController.getPoemBySlug));

router.get('/tags', catchErrors(storeController.getPoemsByTags));
router.get('/tags/:tag', catchErrors(storeController.getPoemsByTags));

router.get('/login', userController.loginForm);
router.post('/login', authController.login);
router.get('/register', userController.registerForm);

router.get('/favorites',
    authController.isLoggedIn,
    catchErrors(storeController.getFavorites)
);


router.post('/register',
    // 1. Validate the reg data
    userController.validateRegister,
    // 2. register the user
    userController.register,
    // 3. we need to log them in
    authController.login
);

router.get('/logout', authController.logout);

router.get('/account', authController.isLoggedIn, userController.account);
router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post('/account/reset/:token',
    authController.confirmPasswords,
    catchErrors(authController.update)
);

router.post('/comments/:id',
    authController.isLoggedIn,
    catchErrors(commentController.addComment)
);

/*

    API

*/

router.get('/api/v1/search', catchErrors(storeController.searchPoems));
router.post('/api/v1/poems/:id/heart', catchErrors(storeController.heartPoem));

module.exports = router;
