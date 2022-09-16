import storage from "store";
import expirePlugin from "store/plugins/expire";
import { userApi } from "@/service/api";
import { ACCESS_TOKEN } from "@/store/mutation-types";
import { welcome } from "@/utils/util";
import { getAction, postAction } from "@/utils/manage";

storage.addPlugin(expirePlugin);
const user = {
  state: {
    token: "",
    name: "",
    welcome: "",
    avatar: "",
    roles: [],
    info: {
      id: null,
      username: null,
      name: null,
      avatar: null,
      background: null,
      gender: null,
      phone: null,
      identity: null,
      authenticate: null,
      wx_unionid: null,
      wx_nickname: null,
      recent_login_time: null,
      is_admin: null,
      status: null,
      created_at: null,
      updated_at: null
    }
  },

  mutations: {
    SET_TOKEN: (state, token) => {
      state.token = token;
    },
    SET_NAME: (state, { name, welcome }) => {
      state.name = name;
      state.welcome = welcome;
    },
    SET_AVATAR: (state, avatar) => {
      state.avatar = avatar;
    },
    SET_ROLES: (state, roles) => {
      state.roles = roles;
    },
    SET_INFO: (state, info) => {
      state.info = info;
    }
  },

  actions: {
    // 登录
    Login({ commit }, userInfo) {
      return new Promise((resolve, reject) => {
        postAction(userApi.login, userInfo).then(response => {
          const result = response.data;
          storage.set(ACCESS_TOKEN, result.token, new Date().getTime() + 7 * 24 * 60 * 60 * 1000);
          commit("SET_TOKEN", result.token);
          resolve();
        }).catch(error => {
          reject(error);
        });
      });
    },

    // 获取用户信息
    GetInfo({ commit }) {
      return new Promise((resolve, reject) => {
        // 请求后端获取用户信息 /api/user/info
        getAction(userApi.getInfo).then(response => {
          const { data } = response;
          const roleObj = {
            id: 'admin',
            name: '管理员',
            describe: '拥有所有权限',
            status: 1,
            creatorId: 'system',
            createTime: 1497160610259,
            deleted: 0,
            permissions: [
              {
                roleId: 'admin',
                permissionId: 'dashboard',
                permissionName: '仪表盘',
                actions:
                  '[{"action":"add","defaultCheck":false,"describe":"新增"},{"action":"query","defaultCheck":false,"describe":"查询"},{"action":"get","defaultCheck":false,"describe":"详情"},{"action":"update","defaultCheck":false,"describe":"修改"},{"action":"delete","defaultCheck":false,"describe":"删除"}]',
                actionEntitySet: [
                  {
                    action: 'add',
                    describe: '新增',
                    defaultCheck: false
                  },
                  {
                    action: 'query',
                    describe: '查询',
                    defaultCheck: false
                  },
                  {
                    action: 'get',
                    describe: '详情',
                    defaultCheck: false
                  },
                  {
                    action: 'update',
                    describe: '修改',
                    defaultCheck: false
                  },
                  {
                    action: 'delete',
                    describe: '删除',
                    defaultCheck: false
                  }
                ],
                actionList: null,
                dataAccess: null
              },
              {
                roleId: 'admin',
                permissionId: 'exception',
                permissionName: '异常页面权限',
                actions:
                  '[{"action":"add","defaultCheck":false,"describe":"新增"},{"action":"query","defaultCheck":false,"describe":"查询"},{"action":"get","defaultCheck":false,"describe":"详情"},{"action":"update","defaultCheck":false,"describe":"修改"},{"action":"delete","defaultCheck":false,"describe":"删除"}]',
                actionEntitySet: [
                  {
                    action: 'add',
                    describe: '新增',
                    defaultCheck: false
                  },
                  {
                    action: 'query',
                    describe: '查询',
                    defaultCheck: false
                  },
                  {
                    action: 'get',
                    describe: '详情',
                    defaultCheck: false
                  },
                  {
                    action: 'update',
                    describe: '修改',
                    defaultCheck: false
                  },
                  {
                    action: 'delete',
                    describe: '删除',
                    defaultCheck: false
                  }
                ],
                actionList: null,
                dataAccess: null
              },
              {
                roleId: 'admin',
                permissionId: 'result',
                permissionName: '结果权限',
                actions:
                  '[{"action":"add","defaultCheck":false,"describe":"新增"},{"action":"query","defaultCheck":false,"describe":"查询"},{"action":"get","defaultCheck":false,"describe":"详情"},{"action":"update","defaultCheck":false,"describe":"修改"},{"action":"delete","defaultCheck":false,"describe":"删除"}]',
                actionEntitySet: [
                  {
                    action: 'add',
                    describe: '新增',
                    defaultCheck: false
                  },
                  {
                    action: 'query',
                    describe: '查询',
                    defaultCheck: false
                  },
                  {
                    action: 'get',
                    describe: '详情',
                    defaultCheck: false
                  },
                  {
                    action: 'update',
                    describe: '修改',
                    defaultCheck: false
                  },
                  {
                    action: 'delete',
                    describe: '删除',
                    defaultCheck: false
                  }
                ],
                actionList: null,
                dataAccess: null
              },
              {
                roleId: 'admin',
                permissionId: 'profile',
                permissionName: '详细页权限',
                actions:
                  '[{"action":"add","defaultCheck":false,"describe":"新增"},{"action":"query","defaultCheck":false,"describe":"查询"},{"action":"get","defaultCheck":false,"describe":"详情"},{"action":"update","defaultCheck":false,"describe":"修改"},{"action":"delete","defaultCheck":false,"describe":"删除"}]',
                actionEntitySet: [
                  {
                    action: 'add',
                    describe: '新增',
                    defaultCheck: false
                  },
                  {
                    action: 'query',
                    describe: '查询',
                    defaultCheck: false
                  },
                  {
                    action: 'get',
                    describe: '详情',
                    defaultCheck: false
                  },
                  {
                    action: 'update',
                    describe: '修改',
                    defaultCheck: false
                  },
                  {
                    action: 'delete',
                    describe: '删除',
                    defaultCheck: false
                  }
                ],
                actionList: null,
                dataAccess: null
              },
              {
                roleId: 'admin',
                permissionId: 'recovery',
                permissionName: '康复权限',
                actions:
                  '[{"action":"add","defaultCheck":false,"describe":"新增"},{"action":"import","defaultCheck":false,"describe":"导入"},{"action":"get","defaultCheck":false,"describe":"详情"},{"action":"update","defaultCheck":false,"describe":"修改"},{"action":"edit","defaultCheck":false,"describe":"编辑"}]',
                actionEntitySet: [
                  {
                    action: 'add',
                    describe: '新增',
                    defaultCheck: false
                  },
                  {
                    action: 'import',
                    describe: '导入',
                    defaultCheck: false
                  },
                  {
                    action: 'get',
                    describe: '详情',
                    defaultCheck: false
                  },
                  {
                    action: 'update',
                    describe: '修改',
                    defaultCheck: false
                  },
                  {
                    action: 'edit',
                    describe: '编辑',
                    defaultCheck: false
                  }
                ],
                actionList: null,
                dataAccess: null
              },
              {
                roleId: 'admin',
                permissionId: 'store',
                permissionName: '商城权限',
                actions:
                  '[{"action":"add","defaultCheck":false,"describe":"新增"},{"action":"import","defaultCheck":false,"describe":"导入"},{"action":"get","defaultCheck":false,"describe":"详情"},{"action":"update","defaultCheck":false,"describe":"修改"},{"action":"edit","defaultCheck":false,"describe":"编辑"}]',
                actionEntitySet: [
                  {
                    action: 'add',
                    describe: '新增',
                    defaultCheck: false
                  },
                  {
                    action: 'import',
                    describe: '导入',
                    defaultCheck: false
                  },
                  {
                    action: 'get',
                    describe: '详情',
                    defaultCheck: false
                  },
                  {
                    action: 'update',
                    describe: '修改',
                    defaultCheck: false
                  },
                  {
                    action: 'edit',
                    describe: '编辑',
                    defaultCheck: false
                  }
                ],
                actionList: null,
                dataAccess: null
              },
              {
                roleId: 'admin',
                permissionId: 'table',
                permissionName: '表格权限',
                actions:
                  '[{"action":"add","defaultCheck":false,"describe":"新增"},{"action":"import","defaultCheck":false,"describe":"导入"},{"action":"get","defaultCheck":false,"describe":"详情"},{"action":"update","defaultCheck":false,"describe":"修改"}]',
                actionEntitySet: [
                  {
                    action: 'add',
                    describe: '新增',
                    defaultCheck: false
                  },
                  {
                    action: 'import',
                    describe: '导入',
                    defaultCheck: false
                  },
                  {
                    action: 'get',
                    describe: '详情',
                    defaultCheck: false
                  },
                  {
                    action: 'update',
                    describe: '修改',
                    defaultCheck: false
                  }
                ],
                actionList: null,
                dataAccess: null
              },
              {
                roleId: 'admin',
                permissionId: 'form',
                permissionName: '表单权限',
                actions:
                  '[{"action":"add","defaultCheck":false,"describe":"新增"},{"action":"get","defaultCheck":false,"describe":"详情"},{"action":"query","defaultCheck":false,"describe":"查询"},{"action":"update","defaultCheck":false,"describe":"修改"},{"action":"delete","defaultCheck":false,"describe":"删除"}]',
                actionEntitySet: [
                  {
                    action: 'add',
                    describe: '新增',
                    defaultCheck: false
                  },
                  {
                    action: 'get',
                    describe: '详情',
                    defaultCheck: false
                  },
                  {
                    action: 'query',
                    describe: '查询',
                    defaultCheck: false
                  },
                  {
                    action: 'update',
                    describe: '修改',
                    defaultCheck: false
                  },
                  {
                    action: 'delete',
                    describe: '删除',
                    defaultCheck: false
                  }
                ],
                actionList: null,
                dataAccess: null
              },
              {
                roleId: 'admin',
                permissionId: 'order',
                permissionName: '订单管理',
                actions:
                  '[{"action":"add","defaultCheck":false,"describe":"新增"},{"action":"query","defaultCheck":false,"describe":"查询"},{"action":"get","defaultCheck":false,"describe":"详情"},{"action":"update","defaultCheck":false,"describe":"修改"},{"action":"delete","defaultCheck":false,"describe":"删除"}]',
                actionEntitySet: [
                  {
                    action: 'add',
                    describe: '新增',
                    defaultCheck: false
                  },
                  {
                    action: 'query',
                    describe: '查询',
                    defaultCheck: false
                  },
                  {
                    action: 'get',
                    describe: '详情',
                    defaultCheck: false
                  },
                  {
                    action: 'update',
                    describe: '修改',
                    defaultCheck: false
                  },
                  {
                    action: 'delete',
                    describe: '删除',
                    defaultCheck: false
                  }
                ],
                actionList: null,
                dataAccess: null
              },
              {
                roleId: 'admin',
                permissionId: 'permission',
                permissionName: '权限管理',
                actions:
                  '[{"action":"add","defaultCheck":false,"describe":"新增"},{"action":"get","defaultCheck":false,"describe":"详情"},{"action":"update","defaultCheck":false,"describe":"修改"},{"action":"delete","defaultCheck":false,"describe":"删除"}]',
                actionEntitySet: [
                  {
                    action: 'add',
                    describe: '新增',
                    defaultCheck: false
                  },
                  {
                    action: 'get',
                    describe: '详情',
                    defaultCheck: false
                  },
                  {
                    action: 'update',
                    describe: '修改',
                    defaultCheck: false
                  },
                  {
                    action: 'delete',
                    describe: '删除',
                    defaultCheck: false
                  }
                ],
                actionList: null,
                dataAccess: null
              },
              {
                roleId: 'admin',
                permissionId: 'role',
                permissionName: '角色管理',
                actions:
                  '[{"action":"add","defaultCheck":false,"describe":"新增"},{"action":"get","defaultCheck":false,"describe":"详情"},{"action":"update","defaultCheck":false,"describe":"修改"},{"action":"delete","defaultCheck":false,"describe":"删除"}]',
                actionEntitySet: [
                  {
                    action: 'add',
                    describe: '新增',
                    defaultCheck: false
                  },
                  {
                    action: 'get',
                    describe: '详情',
                    defaultCheck: false
                  },
                  {
                    action: 'update',
                    describe: '修改',
                    defaultCheck: false
                  },
                  {
                    action: 'delete',
                    describe: '删除',
                    defaultCheck: false
                  }
                ],
                actionList: null,
                dataAccess: null
              },
              {
                roleId: 'admin',
                permissionId: 'table',
                permissionName: '桌子管理',
                actions:
                  '[{"action":"add","defaultCheck":false,"describe":"新增"},{"action":"get","defaultCheck":false,"describe":"详情"},{"action":"query","defaultCheck":false,"describe":"查询"},{"action":"update","defaultCheck":false,"describe":"修改"},{"action":"delete","defaultCheck":false,"describe":"删除"}]',
                actionEntitySet: [
                  {
                    action: 'add',
                    describe: '新增',
                    defaultCheck: false
                  },
                  {
                    action: 'get',
                    describe: '详情',
                    defaultCheck: false
                  },
                  {
                    action: 'query',
                    describe: '查询',
                    defaultCheck: false
                  },
                  {
                    action: 'update',
                    describe: '修改',
                    defaultCheck: false
                  },
                  {
                    action: 'delete',
                    describe: '删除',
                    defaultCheck: false
                  }
                ],
                actionList: null,
                dataAccess: null
              },
              {
                roleId: 'admin',
                permissionId: 'user',
                permissionName: '用户管理',
                actions:
                  '[{"action":"add","defaultCheck":false,"describe":"新增"},{"action":"import","defaultCheck":false,"describe":"导入"},{"action":"get","defaultCheck":false,"describe":"详情"},{"action":"update","defaultCheck":false,"describe":"修改"},{"action":"delete","defaultCheck":false,"describe":"删除"},{"action":"export","defaultCheck":false,"describe":"导出"}]',
                actionEntitySet: [
                  {
                    action: 'add',
                    describe: '新增',
                    defaultCheck: false
                  },
                  {
                    action: 'import',
                    describe: '导入',
                    defaultCheck: false
                  },
                  {
                    action: 'get',
                    describe: '详情',
                    defaultCheck: false
                  },
                  {
                    action: 'update',
                    describe: '修改',
                    defaultCheck: false
                  },
                  {
                    action: 'delete',
                    describe: '删除',
                    defaultCheck: false
                  },
                  {
                    action: 'export',
                    describe: '导出',
                    defaultCheck: false
                  }
                ],
                actionList: null,
                dataAccess: null
              }
            ]
          }
          roleObj.permissions.push({
            roleId: 'admin',
            permissionId: 'support',
            permissionName: '超级模块',
            actions:
              '[{"action":"add","defaultCheck":false,"describe":"新增"},{"action":"import","defaultCheck":false,"describe":"导入"},{"action":"get","defaultCheck":false,"describe":"详情"},{"action":"update","defaultCheck":false,"describe":"修改"},{"action":"delete","defaultCheck":false,"describe":"删除"},{"action":"export","defaultCheck":false,"describe":"导出"}]',
            actionEntitySet: [
              {
                action: 'add',
                describe: '新增',
                defaultCheck: false
              },
              {
                action: 'import',
                describe: '导入',
                defaultCheck: false
              },
              {
                action: 'get',
                describe: '详情',
                defaultCheck: false
              },
              {
                action: 'update',
                describe: '修改',
                defaultCheck: false
              },
              {
                action: 'delete',
                describe: '删除',
                defaultCheck: false
              },
              {
                action: 'export',
                describe: '导出',
                defaultCheck: false
              }
            ],
            actionList: null,
            dataAccess: null
          })
          data.role = roleObj
          resolve(data);
          if (data.role && data.role.permissions.length > 0) {
            const role = { ...data.role };
            role.permissions = data.role.permissions.map(permission => {
              const per = {
                ...permission,
                actionList: (permission.actionEntitySet || {}).map(item => item.action)
              };
              return per;
            });
            role.permissionList = role.permissions.map(permission => {
              return permission.permissionId;
            });
            // 覆盖响应体的 role, 供下游使用
            data.role = role;

            commit("SET_ROLES", role);
            commit("SET_INFO", data);
            commit("SET_NAME", { name: data.name, welcome: welcome() });
            commit("SET_AVATAR", data.avatar);
            // 下游
            resolve(data);
          } else {
            reject(new Error("getInfo: roles must be a non-null array !"));
          }
        }).catch(error => {
          reject(error);
        });
      });
    },

    // 登出
    Logout({ commit, state }) {
      return new Promise((resolve) => {
        commit("SET_TOKEN", "");
        commit("SET_ROLES", []);
        storage.remove(ACCESS_TOKEN);
        resolve();
        /*postAction(userApi.logout).then(() => {
          commit("SET_TOKEN", "");
          commit("SET_ROLES", []);
          storage.remove(ACCESS_TOKEN);
          resolve();
        }).catch((err) => {
          console.log("logout fail:", err);
          // resolve()
        }).finally(() => {
        });*/
      });
    }

  }
};

export default user;
