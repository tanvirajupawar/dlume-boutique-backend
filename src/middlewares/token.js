require('dotenv').config();

// Cookie token expiry configuration
const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || '300', 10); // in hours
const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '1200', 10); // in days

// Access Token Cookie Options
const accessTokenOptions = {
  expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
  maxAge: accessTokenExpire * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'lax',
  // secure: true, // Enable if using HTTPS
};

// Refresh Token Cookie Options
const refreshTokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'lax',
  // secure: true,
};

// Send token and set cookies
const sendToken = async (user, statusCode, res) => {
  const accessToken = user.SignAccessToken();
  const refreshToken = user.SignRefreshToken();


  res.cookie('access_token', accessToken, accessTokenOptions);
  res.cookie('refresh_token', refreshToken, refreshTokenOptions);

  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
  });
};

module.exports = {
  sendToken,
  accessTokenOptions,
  refreshTokenOptions,
  accessTokenExpire,
  refreshTokenExpire,
};
