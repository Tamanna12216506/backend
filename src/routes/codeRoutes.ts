import express from 'express';
import fs from 'fs';
import { exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const router = express.Router();

const tempDir = path.join(process.cwd(), 'temp-code');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

router.post('/run', async (req, res) => {
  const { language, code } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: 'Language and code are required' });
  }

  const id = uuidv4();
  let filename, runCmd;

  switch (language) {
    case 'cpp':
      filename = `${id}.cpp`;
      runCmd = `g++ ${filename} -o ${id} && ./${id}`;
      break;
    case 'python':
      filename = `${id}.py`;
      runCmd = `python3 ${filename}`;
      break;
    case 'javascript':
      filename = `${id}.js`;
      runCmd = `node ${filename}`;
      break;
    default:
      return res.status(400).json({ error: 'Unsupported language' });
  }

  const filePath = path.join(tempDir, filename);
  fs.writeFileSync(filePath, code);

  exec(runCmd, { cwd: tempDir, timeout: 5000 }, (error, stdout, stderr) => {
    fs.unlinkSync(filePath);
    if (language === 'cpp') {
      const exePath = path.join(tempDir, id);
      if (fs.existsSync(exePath)) fs.unlinkSync(exePath);
    }

    if (error) {
      return res.status(200).json({ output: stderr || error.message });
    }

    return res.status(200).json({ output: stdout });
  });
});

export default router;
