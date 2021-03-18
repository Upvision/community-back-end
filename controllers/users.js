const User = require('../models/user');
const jwtDecode = require('jwt-decode');
const { body, validationResult } = require('express-validator');
const {OAuth2Client} = require('google-auth-library');

const { createToken, hashPassword, verifyPassword } = require('../utils/authentication');
// const { response } = require('express');

const client = new OAuth2Client("613584530661-s728h4rlgc4f63tnjaeg13s7dvb19vnk.apps.googleusercontent.com");

exports.signup = async (req, res) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array({ onlyFirstError: true });
    return res.status(422).json({ errors });
  }

  try {
    const { username } = req.body;

    const hashedPassword = await hashPassword(req.body.password);
    const userData = {
      username: username.toLowerCase(),
      password: hashedPassword
    };

    const existingUsername = await User.findOne({
      username: userData.username
    });
    console.log("a-0")
    if (existingUsername) {
      return res.status(400).json({
        message: 'Username already exists.'
      });
    }

    const newUser = new User(userData);
    const savedUser = await newUser.save();

    if (savedUser) {
      const token = createToken(savedUser);
      const decodedToken = jwtDecode(token);
      const expiresAt = decodedToken.exp;

      const { username, role, id, created, profilePhoto } = savedUser;
      const userInfo = {
        username,
        role,
        id,
        created,
        profilePhoto
      };
      console.log("a-1")
      return res.json({
        message: 'User created!',
        token,
        userInfo,
        expiresAt
      });
    } else {
      return res.status(400).json({
        message: 'There was a problem creating your account.'
      });
    }
  } catch (error) {
    return res.status(400).json({
      message: 'There was a problem creating your account.'
    });
  }
};

exports.authenticate = async (req, res) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array({ onlyFirstError: true });
    return res.status(422).json({ errors });
  }
  try {
    const { username, password } = req.body;
    const user = await User.findOne({
      username: username.toLowerCase()
    });

    if (!user) {
      return res.status(403).json({
        message: 'Wrong username or password.'
      });
    }

    const passwordValid = await verifyPassword(password, user.password);

    if (passwordValid) {
      const token = createToken(user);
      const decodedToken = jwtDecode(token);
      const expiresAt = decodedToken.exp;
      const { username, role, id, created, profilePhoto } = user;
      const userInfo = { username, role, id, created, profilePhoto };

      res.json({
        message: 'Authentication successful!',
        token,
        userInfo,
        expiresAt
      });
    } else {
      res.status(403).json({
        message: 'Wrong username or password.'
      });
    }
  } catch (error) {
    return res.status(400).json({
      message: 'Something went wrong.'
    });
  }
};

exports.listUsers = async (req, res, next) => {
  try {
    const { sortType = '-created' } = req.body;
    const users = await User.find().sort(sortType);
    res.json(users);
  } catch (error) {
    next(error);
  }
};

exports.search = async (req, res, next) => {
  try {
    const users = await User.find({ username: { $regex: req.params.search, $options: 'i' } });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

exports.find = async (req, res, next) => {
  try {
    const users = await User.findOne({ username: req.params.username });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

exports.validateUser = [
  body('username')
    .exists()
    .trim()
    .withMessage('is required')

    .notEmpty()
    .withMessage('cannot be blank')

    .isLength({ max: 16 })
    .withMessage('must be at most 16 characters long')

    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('contains invalid characters'),

  body('password')
    .exists()
    .trim()
    .withMessage('is required')

    .notEmpty()
    .withMessage('cannot be blank')

    .isLength({ min: 6 })
    .withMessage('must be at least 6 characters long')

    .isLength({ max: 50 })
    .withMessage('must be at most 50 characters long')
];

exports.googlelogin = (req,res) => {
  const {tokenId} = req.body;
  console.log(req.body);
  client.verifyIdToken({idToken: tokenId, audience:"613584530661-s728h4rlgc4f63tnjaeg13s7dvb19vnk.apps.googleusercontent.com"}).then(response => {
    const{email_verified, name, email} = response.payload;
    console.log("0")
    if(email_verified)
    {
            var up = email.split('@');
            if(up[1]!= "nitdelhi.ac.in")
            {
              res.json( {status:false})
            }
            else{
              console.log("yes")
              res.json( {status:true})
            }
        //     const  username  = up[0];
        //     const hashedPassword = await hashPassword(username);
        
        //     const userData = {
        //       username: username.toLowerCase(),
        //       password: hashedPassword
        //     };
        //     console.log(userData)
        //     console.log("0")
        //     const existingUsername = await User.findOne({
        //       username: userData.username
        //     });
        //     console.log("1")
        //     console.log(existingUsername)
        //     if (existingUsername) {
        //       console.log(("1.5"))
        //       return res.status(400).json({
        //         message: 'Username already exists.'
        //       });
        //     }
        // console.log("2")
        //     const newUser = new User(userData);
        //     console.log(newUser)
        //     const savedUser = await newUser.save();
            
        //     if (savedUser) {
        //       // console.log(savedUser)
        //       console.log("0")
        //       // const token = createToken(savedUser);
        //       // const decodedToken = jwtDecode(token);
        //       // const expiresAt = decodedToken.exp;
        //   console.log("1")
        //       const { username, role, id, created, profilePhoto } = newUser;
        //       const userInfo = {
        //         username,
        //         role,
        //         id,
        //         created,
        //         profilePhoto
        //       };
        //       console.log(userInfo)
        //     } 
        //     else {
        //       return res.status(400).json({
        //         message: 'There was a problem creating your account.'
        //       });
        //     }
}
else{
         return res.status(400).json({
                message: 'There was a problem creating your account.'
              });
}
  })
}

// exports.googleautho = async (req, res, next) => {
//   console.log("I am in above try")
//   try {
//     console.log("I am in get");
//     console.log(req.body.data);
//     const response = await req.body ;
//     console.log(response)
//     res.json(req.body);
    
//   } catch (error) {
//     next(error);
//   }
// };