const userApi = {
  login: "/user/admin/login",
  capture: "/auth/admin/capture",
  phoneCapture: "/auth/admin/capture_phone",
  logout: "/user/logout",
  getInfo: "/user"
};

const prescriptionApi = {
  get: "/prescription/custom",
  create: '/prescription',
  update: '/prescription',
  uploadVideo: '/prescription/upload/video',
  uploadCover: '/prescription/upload/cover',
  batch: '/prescription/batch'
};

const liveCourseApi = {
  get: "/live_course/custom",
  create: '/live_course',
  update: '/live_course',
  uploadCover: '/live_course/upload/cover',
  batch: '/live_course/batch'
};

const videoCourseApi = {
  get: "/video_course/custom",
  create: '/video_course',
  update: '/video_course',
  uploadCover: '/video_course/upload/cover',
  batch: '/video_course/batch'
};

const courseInVideoApi = {
  get: "/course_in_video/custom",
  create: '/course_in_video',
  update: '/course_in_video',
  uploadVideo: '/course_in_video/upload/video',
  uploadCover: '/course_in_video/upload/cover',
  batch: '/course_in_video/batch'
};

export {
  userApi,
  prescriptionApi,
  liveCourseApi,
  videoCourseApi,
  courseInVideoApi
};