import { AxiosError, AxiosResponse } from 'axios'
import { OK } from 'http-status-codes'

export function generateAxiosResponse<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: OK,
    statusText: 'Ok',
    headers: {
      'content-type': 'application/octet-stream',
      'content-disposition': 'some content disposition',
    },
    config: {}
  }
}

export function generateAxiosError<T>(data: T): AxiosError {
  return {
    config: {},
    isAxiosError: true,
    message: '', name: '',
    toJSON: () => {
      return {}
    },
    response: generateAxiosResponse<T>(data)
  }
}
