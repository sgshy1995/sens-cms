/**
 * 将处方标签列表组装为 ant-design-vue Cascader 需要的树形结构
 * @param data 标签列表
 */
export function buildTagTree (data) {
  const nodes = data.map(item => ({
    ...item,
    value: item.id,
    label: item.title,
    children: []
  }))
  const nodeMap = {}
  nodes.forEach(node => {
    nodeMap[node.id] = node
  })
  const roots = []
  nodes.forEach(node => {
    if (node.parent_id === '0' || !nodeMap[node.parent_id]) {
      roots.push(node)
    } else {
      nodeMap[node.parent_id].children.push(node)
    }
  })
  return roots
}

/**
 * 根据标签 id 找到其在树中的完整 id 路径
 * @param data 标签列表
 * @param id 标签 id
 */
export function getTagPath (data, id) {
  const nodeMap = {}
  data.forEach(item => {
    nodeMap[item.id] = item
  })
  const path = []
  let current = nodeMap[id]
  while (current) {
    path.unshift(current.id)
    if (!current.parent_id || current.parent_id === '0') {
      break
    }
    current = nodeMap[current.parent_id]
  }
  return path
}
