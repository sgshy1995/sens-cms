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

export {
  userApi,
  prescriptionApi
};