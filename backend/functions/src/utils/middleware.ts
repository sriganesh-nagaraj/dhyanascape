import { NextFunction, Request, Response } from 'express'
import { logger } from 'firebase-functions/v2'
import { AnyZodObject } from 'zod'
import { ApiError, ApiErrorCode, ApiResponse } from '../models'

export const requestValidator = (schema: AnyZodObject) => {
  return (request: Request, response: Response, next: NextFunction) => {
    try {
      const validatedRequest = schema.parse(request.body)
      request.body = validatedRequest
      next()
    } catch (error) {
      logger.error('Request validation error', error)
      response
        .status(400)
        .json(
          new ApiResponse(
            null,
            new ApiError(ApiErrorCode.INPUT_VALIDATION_ERROR, 400, error)
          )
        )
    }
  }
}

export const errorHandler = (
  error: Error,
  request: Request,
  response: Response
) => {
  if (error instanceof ApiError) {
    if (error.statusCode === 401) {
      logger.debug('UNAUTHORIZED', error)
    } else {
      logger.error('Api error', error)
    }
    response.status(error.statusCode).json(new ApiResponse(null, error))
  } else {
    logger.error('Internal error', error)
    response
      .status(500)
      .json(new ApiResponse(null, new ApiError(error.message)))
  }
}
