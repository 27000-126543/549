import app from './app.js';

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log('========================================');
  console.log('  企业级任务调度平台 API 服务');
  console.log('========================================');
  console.log(`  服务端口: ${PORT}`);
  console.log(`  健康检查: http://localhost:${PORT}/api/health`);
  console.log(`  API 前缀: http://localhost:${PORT}/api`);
  console.log('========================================');
  console.log('  默认账号: admin / admin123');
  console.log('========================================');
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
