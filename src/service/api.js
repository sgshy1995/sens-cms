const userApi = {
  login: "/user/admin/login",
  capture: "/auth/admin/capture",
  phoneCapture: "/auth/admin/capture_phone",
  logout: "/user/logout",
  getInfo: "/user"
};


const usersApi = {
  get: "/user/custom",
  updateIfLectureAuth: "/user/if_lecture_auth"
};

const authenticatesApi = {
  get: "/authenticate/custom",
  getOneById: (id) => `/authenticate/id/${id}`,
  audit: '/authenticate/audit'
};

const prescriptionApi = {
  get: "/prescription/custom",
  create: "/prescription",
  update: "/prescription",
  uploadVideo: "/prescription/upload/video",
  uploadCover: "/prescription/upload/cover",
  batch: "/prescription/batch",
  batchChangeTag: "/prescription/batch_tag",
  getOneById: (id) => `/prescription/id/${id}`,
};

const prescriptionTagApi = {
  getAll: "/prescription_tag",
  getCustom: "/prescription_tag/custom",
  create: "/prescription_tag",
  update: "/prescription_tag",
  getOneById: (id) => `/prescription_tag/id/${id}`,
  deleteOneById: (id) => `/prescription_tag/id/${id}`,
};

const liveCourseApi = {
  get: "/live_course/custom",
  create: "/live_course",
  update: "/live_course",
  uploadCover: "/live_course/upload/cover",
  batch: "/live_course/batch"
};

const videoCourseApi = {
  get: "/video_course/custom",
  create: "/video_course",
  update: "/video_course",
  uploadCover: "/video_course/upload/cover",
  batch: "/video_course/batch"
};

const courseInVideoApi = {
  get: "/course_in_video/custom",
  create: "/course_in_video",
  update: "/course_in_video",
  uploadVideo: "/course_in_video/upload/video",
  uploadCover: "/course_in_video/upload/cover",
  batch: "/course_in_video/batch"
};

const equipmentApi = {
  get: "/equipment/custom",
  check: "/equipment/check",
  create: "/equipment",
  update: "/equipment",
  uploadCover: "/equipment/upload/cover",
  updateLong: "/equipment/upload/long_figure",
  batch: "/equipment/batch"
};

const equipmentModelApi = {
  get: "/equipment_model/custom",
  create: "/equipment_model",
  update: "/equipment_model",
  uploadDataMultiFigure: "/equipment_model/upload/multi_figure",
  batch: "/equipment_model/batch"
};

const equipmentOrderApi = {
  get: "/equipment_order/custom",
  shipment: "/equipment_order/shipment"
};

const courierApi = {
  courier: "/courier/courier_info",
  courier_company_list: "/courier/courier_company_list"
};

export {
  userApi,
  prescriptionApi,
  prescriptionTagApi,
  liveCourseApi,
  videoCourseApi,
  courseInVideoApi,
  equipmentApi,
  equipmentModelApi,
  equipmentOrderApi,
  courierApi,
  usersApi,
  authenticatesApi
};