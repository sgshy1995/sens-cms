<template>
  <a-modal
    :maskClosable="false"
    :title="viewType === 'edit' ? '编辑处方' : '新建处方'"
    :width="840"
    :visible="visible"
    :confirmLoading="loading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-spin :spinning="loading">
      <a-form-model ref="RuleForm" :rules="rules" :model="form" v-bind="formLayout">
        <!-- 检查是否有 id 并且大于0，大于0是修改。其他是新增，新增不显示主键ID -->
        <a-form-model-item label="处方标题" required prop="title">
          <a-input v-model="form.title" placeholder="请输入处方标题" />
        </a-form-model-item>
        <a-form-model-item label="处方类型" required prop="prescription_type">
          <a-select v-model="form.prescription_type" placeholder="请选择处方类型">
            <a-select-option :value="0" disabled>文章</a-select-option>
            <a-select-option :value="1">视频</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item label="处方视频" required prop="prescription_video">
          <div style="color: #d6d6d6">支持视频格式文件，尽可能保证视频的清晰度，不要太大</div>
          <a-upload v-model="form.prescription_video" accept="video/*" :file-list="fileList" :remove="handleRemove" :before-upload="beforeUpload">
            <a-button> <a-icon type="upload" /> 选择视频文件 </a-button>
          </a-upload>
        </a-form-model-item>
        <a-form-model-item label="处方封面" prop="cover">
          <div style="color: #D14748">注意：如果不上传，则默认使用视频第一针作为封面。</div>
          <div style="color: #d6d6d6">支持常用图片格式，不要太大</div>
          <img style="width: 400px;height: 250px;margin-bottom: 12px" v-if="coverUrl" :src="coverUrl" alt="cover">
          <a-upload v-model="form.cover" accept="image/*" :file-list="fileListImg" :remove="handleRemoveImg" :before-upload="beforeUploadImg">
            <a-button> <a-icon type="upload" /> 选择图片文件 </a-button>
          </a-upload>
        </a-form-model-item>
        <a-form-model-item label="处方描述" required prop="description">
          <a-textarea v-model="form.description" :rows="6" placeholder="请输入处方描述" />
        </a-form-model-item>
        <a-form-model-item label="处方要点" prop="gist">
          <a-textarea v-model="form.gist" :rows="6" placeholder="请输入处方要点" />
        </a-form-model-item>
        <a-form-model-item label="难度" required prop="difficulty">
          <a-select v-model="form.difficulty" placeholder="请选择难度">
            <a-select-option :value="1">难度1</a-select-option>
            <a-select-option :value="2">难度2</a-select-option>
            <a-select-option :value="3">难度3</a-select-option>
            <a-select-option :value="4">难度4</a-select-option>
            <a-select-option :value="5">难度5</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item label="处方时长" required prop="time_length">
          <a-input v-model="form.time_length" placeholder="请输入处方时长，如1时2分33秒" />
        </a-form-model-item>
        <a-form-model-item label="处方标签" required prop="tag">
          <a-cascader change-on-select v-model="form.tag" :options="dataSource" @change="onChange"  placeholder="请选择处方标签" />
        </a-form-model-item>
        <a-form-model-item label="复健类型" prop="rehabilitation" v-show="form.tag.length">
          <a-input readOnly v-model="form.rehabilitation" placeholder="未选择"></a-input>
          <div style="color: #096dd9;line-height: 1.5">根据选择的处方标签自动显示。</div>
        </a-form-model-item>
        <a-form-model-item label="关节部位" prop="part" v-show="form.tag.length">
          <a-input readOnly v-model="form.part" placeholder="未选择"></a-input>
          <div style="color: #096dd9;line-height: 1.5">根据选择的处方标签自动显示。</div>
        </a-form-model-item>
        <a-form-model-item label="症状" prop="symptoms" v-show="form.tag.length">
          <a-input readOnly v-model="form.symptoms" placeholder="未选择"></a-input>
          <div style="color: #096dd9;line-height: 1.5">根据选择的处方标签自动显示。</div>
        </a-form-model-item>
        <a-form-model-item label="阶段" prop="phase" v-show="form.tag.length">
          <a-input readOnly v-model="form.phase" placeholder="未选择"></a-input>
          <div style="color: #096dd9;line-height: 1.5">根据选择的处方标签自动显示。</div>
        </a-form-model-item>
        <a-form-model-item label="优先级" required prop="priority">
          <a-input-number v-model="form.priority" style="width: 100%" :precision="0" :min="0" :step="1" placeholder="请输入优先级" required prop="priority" />
          <div style="color: #096dd9;line-height: 1.5">优先级：数字越<span style="color: #E97343">小</span>，优先级越<span style="color: #E97343">高</span>，即显示越靠<span style="color: #E97343">前</span>。</div>
        </a-form-model-item>
        <a-form-model-item label="是否发布" required prop="status">
          <a-select v-model="form.status"  placeholder="请选择是否发布">
            <a-select-option :value="1">发布</a-select-option>
            <a-select-option :value="0">下线</a-select-option>
          </a-select>
        </a-form-model-item>
<!--        <a-form-item label="cover" v-show="false">
          <a-input v-decorator="['cover', { initialValue: '' }]" disabled />
        </a-form-item>-->
      </a-form-model>
    </a-spin>
    <video width="400" height="300" v-if="videoUrl" v-show="false" @loadeddata="createPreImg($event)" class="content-video" :src="videoUrl" crossorigin="anonymous" preload="auto" />
  </a-modal>
</template>

<script>
import pick from 'lodash.pick'
import { Modal } from 'ant-design-vue';
import { getAction, postAction, putAction, uploadAction } from "@/utils/manage";
import { prescriptionApi, prescriptionTagApi } from "@/service/api";

// 表单字段
const fields = ['id', 'title', 'prescription_type', 'description', 'gist', 'difficulty', 'time_length', 'part', 'symptoms', 'phase', 'status', 'prescription_video', 'cover']

export default {
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    model: {
      type: Object,
      default: () => null
    }
  },
  data () {
    this.formLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 7 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 13 }
      }
    }
    return {
      loading: true,
      rules: {
        title: [{required: true, min: 2, max: 12, message: '请输入2-14个字符的标题'}],
        prescription_type: [{required: true, trigger: 'change', message: '请选择处方类型'}],
        prescription_video: [{required: true, message: '请上传处方视频'}],
        cover: [{required: false, message: '请上传处方视频'}],
        description: [{required: true, min: 10, max: 800, message: '请输入至少10字符，最多800个字符'}],
        gist: [{required: false, min: 0, max: 800, message: '请输入最多800个字符'}],
        difficulty: [{required: true, trigger: 'change', message: '请选择难度'}],
        time_length: [{required: true, min: 1, message: '请输入处方时长，格式为X时X分X秒'}],
        tag: [{required: true, trigger: 'change', message: '请选择处方标签'}],
        status: [{required: true, trigger: 'change', message: '请选择是否发布'}],
        priority: [{required: true, message: '请输入优先级'}],
      },
      form: {
        title: '',
        prescription_type: 1,
        prescription_video: '',
        cover: '',
        description: '',
        gist: undefined,
        difficulty: undefined,
        time_length: '',
        status: undefined,
        tag: [],
        rehabilitation: undefined,
        part: undefined,
        symptoms: undefined,
        phase: undefined,
        priority: 0
      },
      fileList: [],
      fileListImg: [],
      uploading: false,
      videoUrl: '',
      coverUrl: '',
      coverBlob: null,
      baseUrl: process.env.VUE_APP_API_BASE_URL + '/',
      cdnUrl: process.env.VUE_APP_CDN_BASE_URL + '/',
      id: '',
      dataList: [],
      dataSource: [],
      viewType: 'add'
    }
  },
  created () {
    console.log('custom modal created')
  },
  watch : {
    visible(){
      if (!this.visible){
        this.videoUrl = ''
        this.coverUrl = ''
        this.fileList = []
        this.fileListImg = []
        this.coverBlob = null
        this.id = ''
      }
    },
  },
  methods: {
    getData(id){

      if (id) {
        this.viewType = 'edit'
      }

      getAction(prescriptionTagApi.getAll)
        .then(res => {
          const data = res.data;
          console.log('data', data)
          let dataSourceGet = [];
          this.dataList = data.map(i => {
            return {
              ...i,
              value: i.id,
              label: i.title
            }
          })

          data.forEach((item, index) => {
            if (item.parent_id === '0'){
              console.log('dataSourceGet', dataSourceGet)
              dataSourceGet.push({
                ...item,
                value: item.id,
                label: item.title,
                children: []
              })
            }
          })

          data.forEach((item, index) => {
            if (item.level === 2){
              const indexFind = dataSourceGet.findIndex(i => i.id === item.parent_id);
              dataSourceGet[indexFind].children.push({
                ...item,
                value: item.id,
                label: item.title,
                children: []
              })
            }
          })

          data.forEach((item, index) => {
            if (item.level === 3){
              let indexFind = 0;
              let indexFind1 = 0;
              dataSourceGet.forEach((itemIn, indexIn) => {
                itemIn.children.forEach((itemInner, indexInner) => {
                  if (itemInner.id === item.parent_id){
                    indexFind = indexIn;
                    indexFind1 = indexInner;
                  }
                })
              })
              dataSourceGet[indexFind].children[indexFind1].children.push({
                ...item,
                value: item.id,
                label: item.title,
                children: []
              })
            }
          })

          data.forEach((item, index) => {
            if (item.level === 4){
              let indexFind = 0;
              let indexFind1 = 0;
              let indexFind2 = 0;
              dataSourceGet.forEach((itemIn, indexIn) => {
                itemIn.children.forEach((itemInner, indexInner) => {
                  itemInner.children.forEach((itemInnerIn, indexInnerIn) => {
                    if (itemInnerIn.id === item.parent_id){
                      indexFind = indexIn;
                      indexFind1 = indexInner;
                      indexFind2 = indexInnerIn;
                    }
                  })
                })
              })
              dataSourceGet[indexFind].children[indexFind1].children[indexFind2].children.push({
                ...item,
                value: item.id,
                label: item.title,
                children: []
              })
            }
          })

          this.dataSource = [...dataSourceGet]

          if (id){

            getAction(prescriptionApi.getOneById(id))
              .then(resIn => {
                const data = resIn.data;
                this.form.id = data.id;
                this.form.title = data.title;
                this.form.time_length = data.time_length;
                this.form.prescription_type = data.prescription_type;
                this.form.status = data.status;
                this.form.priority = data.priority;
                this.form.prescription_video = data.prescription_video;
                this.form.description = data.description;
                this.form.gist = data.gist;
                this.form.difficulty = data.difficulty;
                this.form.cover = data.cover;
                if(data.cover && typeof data.cover === 'string') {
                  this.coverUrl = this.cdnUrl + data.cover
                }

                this.form.tag = []

                if (data.rehabilitation){
                  this.form.tag.push(data.rehabilitation)
                }
                if (data.part){
                  this.form.tag.push(data.part)
                }
                if (data.symptoms){
                  this.form.tag.push(data.symptoms)
                }
                if (data.phase){
                  this.form.tag.push(data.phase)
                }

                this.form.rehabilitation = data.rehabilitation ? this.dataList.find(i => i.id === data.rehabilitation).title : undefined;
                this.form.part = data.part ? this.dataList.find(i => i.id === data.part).title : undefined;
                this.form.symptoms = data.symptoms ? this.dataList.find(i => i.id === data.symptoms).title : undefined;
                this.form.phase = data.phase ? this.dataList.find(i => i.id === data.phase).title : undefined;



                this.loading = false;
              })
          }else{
            this.loading = false;
          }

        }).finally(() => {

      });
    },
    onChange(value) {
      console.log(value);
      this.form.rehabilitation = value.length >= 1 ? this.dataList.find(i => i.id === value[0]).title : undefined;
      this.form.part = value.length >= 2 ? this.dataList.find(i => i.id === value[1]).title : undefined;
      this.form.symptoms = value.length >= 3 ? this.dataList.find(i => i.id === value[2]).title : undefined;
      this.form.phase = value.length >= 4 ? this.dataList.find(i => i.id === value[3]).title : undefined;
    },
    handleOk(){
      const that = this
      this.$confirm({
        title: '确定提交吗?',
        content: h => <div style="color:red;">注意：处方视频上传没有人工或系统审核，请务必保证视频的合法合规性，以避免不必要的损失！</div>,
        onOk() {
          console.log('OK');
          that.handleOkSubmit()
        },
        onCancel() {
          console.log('Cancel');
        },
        class: 'test',
      });
    },
    handleOkSubmit(){
      const form = this.$refs.RuleForm;
      form.validate((valid, detail) => {
        if (valid) {
          this.loading = true;
          const formIn = {
            title: this.form.title,
            prescription_type: this.form.prescription_type,
            description: this.form.description,
            gist: this.form.gist,
            difficulty: this.form.difficulty,
            time_length: this.form.time_length,
            status: this.form.status,
            rehabilitation: this.form.tag[0],
            part: this.form.tag[1] ? this.form.tag[1] : null,
            symptoms: this.form.tag[2] ? this.form.tag[2] : null,
            phase: this.form.tag[3] ? this.form.tag[3] : null,
            priority: this.form.priority
          };
          if (this.viewType === 'add') {
            // 修改 e.g.
            const formDataVideo = new FormData();
            formDataVideo.append("file", this.form.prescription_video.file);
            const formDataCover = new FormData();
            formDataCover.append("file", this.form.cover.file);
            Promise.all([
              uploadAction(prescriptionApi.uploadVideo, formDataVideo),
              uploadAction(prescriptionApi.uploadCover, formDataCover)
            ]).then(responses => {
              formIn.prescription_video = responses[0].data;
              formIn.cover = responses[1].data;

              postAction(prescriptionApi.create, formIn).then(res => {
                // 重置表单数据
                form.resetFields();
                this.$message.success(res.message || "添加成功");
                this.$emit('ok');
              }).catch(err1 => {
                this.$message.error((err1.data && err1.data.message) || "添加失败");
              }).finally(() => {
                this.loading = false;
              });

            }).catch(err => {
              this.loading = false;
              this.$message.error((err.data && err.data.message) || "添加失败");
            });
          } else {
            formIn.id = this.form.id;
            formIn.prescription_video = this.form.prescription_video;
            formIn.cover = this.form.cover;
            console.log("formIn", formIn);
            if (!this.fileList.length && !this.fileListImg.length) {
              this.handleUpdateForm(formIn).then(res => {
                // 重置表单数据
                form.resetFields();
                this.$message.success(res.message || "添加成功");
                this.$emit('ok');
              }).catch(err1 => {
                this.$message.error((err1.data && err1.data.message) || "添加失败");
              }).finally(() => {
                this.loading = false;
              });
            } else {
              const formDataVideo = new FormData();
              formDataVideo.append("file", this.form.prescription_video.file);
              const formDataCover = new FormData();
              formDataCover.append("file", this.form.cover.file);
              Promise.all([
                uploadAction(prescriptionApi.uploadVideo, formDataVideo),
                uploadAction(prescriptionApi.uploadCover, formDataCover)
              ]).then(responses => {
                formIn.prescription_video = responses[0].data;
                formIn.cover = responses[1].data;
                this.handleUpdateForm(formIn).then(res => {
                  // 重置表单数据
                  form.resetFields();
                  this.$message.success(res.message || "添加成功");
                  this.$emit('ok');
                }).catch(err1 => {
                  this.$message.error((err1.data && err1.data.message) || "添加失败");
                }).finally(() => {
                  this.loading = false;
                });
              }).catch(err => {
                this.loading = false;
                this.$message.error((err.data && err.data.message) || "更新失败");
              });
            }
          }
        }else{
          console.log(valid, detail)
        }
      });
    },
    handleUpdateForm(formIn) {
      return new Promise((resolve, reject) => {
        putAction(prescriptionApi.update, formIn).then(res => {
          if (res.code === 200){
            resolve(res.message);
          }else{
            reject(res.message);
          }
        }).catch(err1 => {
          reject('操作失败');
        });
      })

    },
    handleCancel(){
      this.$emit('cancel')
    },
    handleRemove(file) {
      const index = this.fileList.indexOf(file);
      const newFileList = this.fileList.slice();
      newFileList.splice(index, 1);
      this.fileList = newFileList;
      this.videoUrl = ''
      this.form.prescription_video = ''
      if(!this.fileListImg.length){
        this.coverUrl = ''
        this.form.cover = ''
        this.coverBlob = null
      }
    },
    beforeUpload(file) {
      console.log('file', file)
      this.fileList = [...this.fileList, file];
      if(!this.fileListImg.length){
        this.form.cover = ''
      }
      this.form.prescription_video = {
        file: file,
      }
      console.log('this.form.prescription_video', this.form.prescription_video)
      this.videoUrl = URL.createObjectURL(file)
      return false;
    },
    handleRemoveImg(file) {
      const index = this.fileListImg.indexOf(file);
      const newFileList = this.fileListImg.slice();
      newFileList.splice(index, 1);
      this.fileListImg = newFileList;
      this.coverUrl = ''
      this.coverBlob = null
      this.form.cover = ''
      if (this.fileList.length){
        this.videoUrl = URL.createObjectURL(this.form.prescription_video)
      }
    },
    beforeUploadImg(file) {
      console.log('file', file)
      this.fileListImg = [...this.fileListImg, file];
      this.form.cover = {
        file: file,
      }
      this.coverUrl = URL.createObjectURL(file)
      return false;
    },
    createPreImg(event) {  // event js原生事件
      if(this.fileListImg.length) return
      const videoEle = event.target; // 当前video dom节点

      videoEle.currentTime = 1; // 设置视频开始播放时间（因为有些手机第一帧显示黑屏，所以这里选取视频的第一秒作为封面）

      videoEle.addEventListener('canplay', () => { // 监听video的canplay事件

        // 创建canvas元素 并设置canvas大小等于video节点的大小
        const canvas = document.createElement('canvas');
        const scale = 0.8; // 压缩系数
        canvas.width = videoEle.videoWidth * scale;
        canvas.height = videoEle.videoHeight * scale;

        // canvas画图
        canvas.getContext('2d').drawImage(videoEle, 0, 0, canvas.width, canvas.height);

        // 把canvas转成base64编码格式
        this.coverUrl = canvas.toDataURL('image/jpeg', 0.5);

        canvas.toBlob((blob)=>{
          this.coverBlob = blob
          this.form.cover = {file: blob}
        }, 'image/jpeg', 0.5);

        canvas.remove()
      });
    },
    reset(){
      const form = this.$refs.RuleForm;
      form.resetFields(); // 清理表单数据（可不做）
      this.form = {
        title: '',
        prescription_type: 1,
        prescription_video: '',
        cover: '',
        description: '',
        gist: undefined,
        difficulty: undefined,
        time_length: '',
        status: undefined,
        tag: [],
        rehabilitation: undefined,
        part: undefined,
        symptoms: undefined,
        phase: undefined,
        priority: 0
      }
    }
  }
}
</script>
