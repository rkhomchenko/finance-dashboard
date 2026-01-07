import dotenv from 'dotenv';
import { createApp } from './app';

dotenv.config();

const PORT = process.env.PORT || 3001;

async function main() {
  try {
    const app = await createApp();

    app.listen(PORT, () => {
      console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📊 API available at http://localhost:${PORT}/api`);
      console.log(`✓ CORS enabled for http://localhost:3002\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
