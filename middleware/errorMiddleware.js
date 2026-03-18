export const notFound = (req, res, next) => {
  // Silent 404 for static uploads
  if (req.path.startsWith('/uploads')) {
    res.status(404).end();
    return;
  }
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  if (!req.path?.startsWith('/uploads')) {
    console.error("ErrorHandler:", err);
  }
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
