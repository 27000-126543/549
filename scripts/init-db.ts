import { initDatabase, store } from '../api/database';

export function initDbScript() {
  console.log('========================================');
  console.log('  企业级任务调度平台 - 数据初始化');
  console.log('========================================');
  console.log('');
  console.log('当前采用内存数据存储模式（Map 结构模拟数据库）');
  console.log('');

  initDatabase();

  console.log('');
  console.log('✓ 初始化完成！数据集合统计：');
  console.log(`  - 租户: ${store.tenants.size}`);
  console.log(`  - 用户: ${store.users.size}`);
  console.log(`  - 部门: ${store.departments.size}`);
  console.log(`  - 角色: ${store.roles.size}`);
  console.log(`  - 项目: ${store.projects.size}`);
  console.log(`  - 任务: ${store.tasks.size}`);
  console.log(`  - 执行节点: ${store.executionNodes.size}`);
  console.log(`  - 审批流: ${store.approvalFlows.size}`);
  console.log(`  - 调度策略: ${store.schedulingStrategies.size}`);
  console.log(`  - 失败任务: ${store.failedTasks.size}`);
  console.log(`  - 死信队列: ${store.deadLetters.size}`);
  console.log(`  - 审计日志: ${store.auditLogs.size}`);
  console.log('');
  console.log('  默认登录账号: admin / admin123');
  console.log('  其他演示账号（密码同为 admin123）:');
  for (const user of store.users.values()) {
    console.log(`    - ${user.username}`);
  }
  console.log('');
  console.log('注意：内存模式下，服务重启后数据将重置');
  console.log('========================================');
}

if (process.argv[1] && process.argv[1].includes('init-db')) {
  initDbScript();
}

export default initDbScript;
