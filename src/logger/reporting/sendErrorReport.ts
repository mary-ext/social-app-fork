import {logger} from '#/logger'

export function sendErrorReport({
  title,
  description,
  handle,
}: {
  title: string
  description: string
  handle: string
}) {
  logger.info('User error report recorded locally', {
    title,
    description,
    handle,
  })
}
