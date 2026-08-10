import request from './request'

/** 上传视频 — POST /videos/upload (multipart/form-data) */
export function uploadVideo(formData: FormData) {
  return request.post('/videos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
