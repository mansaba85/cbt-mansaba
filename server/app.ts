import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });

console.log('--- DATABASE CHECK ---');
console.log('URL:', process.env.DATABASE_URL);
console.log('-----------------------');

let prisma: PrismaClient | any = null;
if (process.env.DATABASE_URL) {
  try {
    prisma = new PrismaClient();
  } catch(e) {
    console.error('Error starting prisma:', e);
  }
}

const app = express();

app.use(cors());
app.use(express.json({ limit: '100mb' }));

// ===== AUTHENTICATION =====
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!prisma) {
    return res.status(500).json({ success: false, error: 'Database belum terhubung (Prisma OFF)' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });
    
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, error: 'Username atau password salah!' });
    }

    // 1. Check if user is suspended
    const recentExam = await prisma.examResult.findFirst({
        where: { userId: user.id },
        orderBy: { startedAt: 'desc' }
    });

    if (recentExam && recentExam.status === 'SUSPENDED') {
        return res.status(403).json({ 
            success: false, 
            error: 'Akun Anda terkunci karena pelanggaran berat. Silakan hubungi proktor untuk membuka kunci.' 
        });
    }

    // 2. Handle Multi-Login Settings
    const toggleSettingsRaw = await prisma.appSetting.findUnique({ where: { key: 'cbt_toggle_settings' } });
    const toggleSettings = toggleSettingsRaw ? JSON.parse(toggleSettingsRaw.value) : { enableMultiLogin: true };

    // 3. Create Session Token
    const sessionToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Session expires in 24 hours

    if (!toggleSettings.enableMultiLogin && user.levelInt < 5) {
        // If multi-login is DISABLED, delete existing sessions for this student
        await prisma.session.deleteMany({
            where: { userId: user.id }
        });
    }

    // Save new session
    const newSession = await prisma.session.create({
        data: {
            userId: user.id,
            token: sessionToken,
            expiresAt: expiresAt
        }
    });
    
    res.json({
      success: true,
      sessionToken: sessionToken,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        levelInt: user.levelInt,
        level: user.level,
        groupId: user.groupId
      }
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan sistem server' });
  }
});

// ===== GRADING / ESSAY MANAGEMENT =====
app.get('/api/grading/exams', async (req, res) => {
  if (!prisma) return res.json([]);
  try {
    // 1. Get all exams with results and their subjects
    const exams = await prisma.exam.findMany({
      include: {
        topicRules: {
          include: { 
            subject: {
               include: {
                 _count: {
                   select: { questions: { where: { type: 'ESSAY' } } }
                 }
               }
            }
          }
        },
        results: {
          select: { id: true },
          take: 1
        }
      }
    });

    // 2. Filter: Exam must have results AND at least one subject must have ESSAY questions
    const filtered = exams.filter(e => {
       const hasResults = e.results.length > 0;
       const hasEssayQuestions = e.topicRules.some(rule => (rule.subject as any)._count.questions > 0);
       return hasResults && hasEssayQuestions;
    });
    
    res.json(filtered.map(e => ({
      id: e.id,
      name: e.name,
      date: e.createdAt.toISOString().split('T')[0],
      totalStudents: e.results.length,
      subject: e.topicRules[0]?.subject?.name || 'Multi Materi'
    })));
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat daftar ujian' });
  }
});

app.get('/api/grading/exams/:id/students', async (req, res) => {
  const { id } = req.params;
  try {
    const results = await prisma.examResult.findMany({
      where: { examId: parseInt(id) },
      include: { 
        user: {
           include: { group: true }
        }
      }
    });

    res.json(results.map(r => ({
      id: r.userId,
      resultId: r.id,
      name: r.user.fullName,
      username: r.user.username,
      group: r.user.group?.name || '--',
      status: r.status,
      score: r.score,
      isGraded: r.answersJson.includes('"manualScore"') // basic check
    })));
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat daftar siswa' });
  }
});

app.get('/api/grading/exams/:examId/students/:userId/details', async (req, res) => {
  const { examId, userId } = req.params;
  try {
    const result = await prisma.examResult.findFirst({
      where: { 
        examId: parseInt(examId),
        userId: parseInt(userId)
      },
      include: {
          exam: {
              include: {
                  topicRules: {
                      include: { subject: true }
                  }
              }
          }
      }
    });

    if (!result) return res.status(404).json({ error: 'Hasil tidak ditemukan' });

    const answers = JSON.parse(result.answersJson);
    const essayQuestions: any[] = [];

    // Get all essay questions from the subjects in this exam
    const subjectIds = result.exam.topicRules.map(r => r.subjectId);
    const allQuestions = await prisma.question.findMany({
        where: {
            subjectId: { in: subjectIds },
            type: 'ESSAY'
        }
    });

    for (const question of allQuestions) {
        const studentAnsObj = answers[question.id.toString()];
        
        essayQuestions.push({
          id: question.id,
          question: question.content,
          studentAnswer: studentAnsObj ? (studentAnsObj.text || studentAnsObj.answer || '') : '',
          keyAnswer: question.explanation || 'Tidak ada kunci jawaban',
          maxScore: 10, // will check points if exist
          currentScore: studentAnsObj ? (studentAnsObj.manualScore || 0) : 0,
          comment: studentAnsObj ? (studentAnsObj.comment || '') : ''
        });
    }

    res.json({
      essayQuestions,
      studentName: (await prisma.user.findUnique({ where: { id: parseInt(userId) } }))?.fullName
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat detail essay' });
  }
});

app.post('/api/grading/save', async (req, res) => {
    const { examId, userId, scores } = req.body; // scores: { questionId: { score, comment } }
    
    try {
        const result = await prisma.examResult.findFirst({
            where: { examId: parseInt(examId), userId: parseInt(userId) }
        });

        if (!result) return res.status(404).json({ error: 'Hasil tdk ditemukan' });

        const answers = JSON.parse(result.answersJson);
        
        // Update each essay score in the JSON
        for (const qId in scores) {
            if (!answers[qId]) {
                // Initialize if student didn't answer
                answers[qId] = {
                    text: '',
                    isCorrect: false,
                    manualScore: 0,
                    comment: ''
                };
            }
            
            answers[qId].manualScore = parseFloat(scores[qId].score) || 0;
            answers[qId].comment = scores[qId].comment || '';
            answers[qId].isCorrect = (parseFloat(scores[qId].score) || 0) > 0;
        }

        const updatedAnswersJson = JSON.stringify(answers);
        
        // 1. Save JSON first
        await prisma.examResult.update({
            where: { id: result.id },
            data: { answersJson: updatedAnswersJson }
        });

        // 2. Recalculate total score
        const newTotalScore = await calculateScoreForExamResult(result.id);

        res.json({ success: true, newScore: newTotalScore });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/check-session', async (req, res) => {
    const { userId, token } = req.body;
    if (!prisma) return res.json({ success: true });

    try {
        const session = await prisma.session.findFirst({
            where: { 
                userId: parseInt(userId),
                token: token
            }
        });

        if (!session) {
            return res.json({ success: false, error: 'invalid_session' });
        }

        res.json({ success: true });
    } catch (err) {
        res.json({ success: true }); 
    }
});

// ===== DASHBOARD STATS =====
app.get('/api/stats', async (req, res) => {
  if (!prisma) return res.status(500).json({ error: 'DB not connected' });
  try {
    const activeExams = await prisma.examResult.count({ where: { status: 'ONGOING' } });
    const totalModules = await prisma.module.count();
    const students = await prisma.user.count({ where: { levelInt: { lt: 5 } } }); // basically STUDENTS
    const completedExams = await prisma.examResult.count({ where: { status: 'COMPLETED' } });
    const activeSessions = await prisma.session.count({
        where: { expiresAt: { gt: new Date() } }
    });
    
    res.json({ activeExams, totalModules, students, completedExams, activeSessions });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat statistik' });
  }
});

// ===== PROCTORING =====
app.get('/api/proctoring', async (req, res) => {
  if (!prisma) return res.json([]);
  try {
    const users = await prisma.user.findMany({
      where: { levelInt: { lt: 5 } },
      include: {
        group: true,
        results: {
          orderBy: { startedAt: 'desc' },
          take: 1,
          include: { exam: true }
        }
      }
    });

    const settingRow = await prisma.appSetting.findUnique({ where: { key: 'cbt_cheat_exempt_users' } });
    const exemptList: number[] = settingRow ? JSON.parse(settingRow.value) : [];

    const proctorData = users.map((user: any) => {
      const recentResult = user.results[0];
      let status = 'offline';
      let progress = 0;
      let questionNo = 0;
      let warnings = 0;
      let timeLeft = '00:00';

      if (recentResult) {
        if (recentResult.status === 'ONGOING') status = 'online';
        else if (recentResult.status === 'SUSPENDED') {
          status = 'locked';
          warnings = 3;
        }
        else if (recentResult.status === 'COMPLETED') {
           status = 'finished';
           progress = 100;
        }

        const answers = recentResult.answersJson ? JSON.parse(recentResult.answersJson) : {};
        const answered = Object.keys(answers).length;
        if (status === 'online' || status === 'locked') {
          progress = answered > 0 ? Math.min(100, answered * 2) : 0;
          questionNo = answered;
          
          let seconds = 0;
          if (recentResult.remainingSeconds !== null && recentResult.remainingSeconds !== undefined) {
             seconds = recentResult.remainingSeconds;
          } else {
             const duration = (recentResult.exam?.duration || 60) * 60;
             const elapsed = Math.floor((Date.now() - new Date(recentResult.startedAt).getTime()) / 1000);
             seconds = Math.max(0, duration - elapsed);
          }
          
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          timeLeft = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
      }

      return {
        id: user.id.toString(),
        name: user.fullName,
        nis: user.username,
        status,
        progress,
        questionNo,
        warnings,
        timeLeft,
        group: user.group ? user.group.name : 'Tanpa Kelas',
        testName: recentResult?.exam?.name || '-',
        lockedAt: recentResult?.startedAt ? new Date(recentResult.startedAt).toLocaleString() : '-',
        isExempt: exemptList.includes(user.id)
      };
    });

    res.json(proctorData);
  } catch (err) {
    res.status(500).json({ error: 'Gagal' });
  }
});

app.post('/api/proctoring/:id/action', async (req, res) => {
  const { id } = req.params;
  const { action, timeLeft } = req.body;
  if (!prisma) return res.status(500).json({ success: false });

  try {
    const userId = parseInt(id);
    const recentResult = await prisma.examResult.findFirst({
        where: { userId },
        orderBy: { startedAt: 'desc' }
    });

    // Helper to update result if exists
    const updateResult = async (data: any) => {
        if (recentResult) {
            await prisma.examResult.update({
                where: { id: recentResult.id },
                data: { 
                    ...data,
                    remainingSeconds: timeLeft ? parseInt(timeLeft) : recentResult.remainingSeconds
                }
            });
        }
    };

    if (action === 'unlock' || action === 'reset_warnings') {
      await updateResult({ status: 'ONGOING' });
    } else if (action === 'suspend') {
      await updateResult({ status: 'SUSPENDED' });
    } else if (action === 'logout') {
        await prisma.session.deleteMany({ where: { userId } });
        await updateResult({ status: 'SUSPENDED' });
    } else if (action === 'reset_finished') {
      await updateResult({ status: 'ONGOING', finishedAt: null, score: 0, remainingSeconds: null });
    }
 else if (action === 'add_time') {
        // Placeholder for time extension logic
    } else if (action === 'toggle_cheat_exempt') {
      const settingRow = await prisma.appSetting.findUnique({ where: { key: 'cbt_cheat_exempt_users' } });
      let exemptList: number[] = settingRow ? JSON.parse(settingRow.value) : [];
      
      if (exemptList.includes(userId)) {
        exemptList = exemptList.filter(uid => uid !== userId);
      } else {
        exemptList.push(userId);
      }
      
      const valStr = JSON.stringify(exemptList);
      await prisma.appSetting.upsert({
        where: { key: 'cbt_cheat_exempt_users' },
        update: { value: valStr },
        create: { key: 'cbt_cheat_exempt_users', value: valStr }
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Gagal memproses aksi proktoring' });
  }
});



// ===== STUDENT EXAM FLOW =====
// Get active exams for students
app.get('/api/exams/active', async (req, res) => {
  if (!prisma) return res.json([]);
  const userId = parseInt(req.query.userId as string);
  
  try {
    const now = new Date();
    // Cari ujian yang sedang aktif saat ini
    const exams = await prisma.exam.findMany({
      where: {
        enabled: true,
        startTime: { lte: now },
        endTime: { gte: now }
      },
      include: {
        topicRules: {
            include: { subject: true }
        },
        results: userId ? {
            where: { userId },
            orderBy: { startedAt: 'desc' },
            take: 1
        } : false
      }
    });

    const formatted = exams.map((e: any) => {
      const totalQ = e.topicRules.reduce((acc: number, r: any) => acc + r.questionCount, 0);
      const latestResult = e.results?.[0];

      let currentStatus = 'available';
      if (latestResult) {
          if (latestResult.status === 'COMPLETED') {
              currentStatus = e.canRepeat ? 'available' : 'completed';
          } else if (latestResult.status === 'SUSPENDED') {
              currentStatus = 'suspended';
          } else if (latestResult.status === 'ONGOING') {
              currentStatus = 'ongoing';
          }
      }

      return {
        id: e.id,
        name: e.name,
        subject: e.topicRules[0]?.subject?.name || 'Materi Campuran',
        duration: e.duration,
        totalQuestions: totalQ,
        status: currentStatus
      };
    });
    res.json(formatted);
  } catch(e) {
    console.error(e);
    res.status(500).json([]);
  }
});

// Get questions for a specific exam (Student Flow)
app.get('/api/exams/:id/questions', async (req, res) => {
  if (!prisma) return res.status(500).json([]);
  const { id } = req.params;

  try {
    const exam = await prisma.exam.findUnique({
      where: { id: parseInt(id) },
      include: { topicRules: true }
    });

    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    let allQuestions: any[] = [];

    // Kumpulkan soal berdasarkan aturan topik
    for (const rule of exam.topicRules) {
      const where: any = { subjectId: rule.subjectId };
      
      // Filter berdasarkan tipe soal jika tidak "all"
      if (rule.questionType && rule.questionType !== 'all') {
        where.type = rule.questionType.toUpperCase();
      }
      
      // Filter berdasarkan kesulitan jika diatur (> 0)
      if (rule.difficulty && rule.difficulty > 0) {
        where.difficulty = rule.difficulty;
      }

      const questions = await prisma.question.findMany({
        where,
        include: { 
          answers: { orderBy: { id: 'asc' } } 
        },
        take: rule.questionCount
      });
      allQuestions = [...allQuestions, ...questions];
    }

    // Fungsi untuk Seeded Random (Deterministic)
    const seededRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };

    const seededShuffle = (array: any[], seedBase: number) => {
        let m = array.length, t, i;
        let seed = seedBase;
        while (m) {
            i = Math.floor(seededRandom(seed++) * m--);
            t = array[m];
            array[m] = array[i];
            array[i] = t;
        }
        return array;
    };

    const rawUserId = req.query.userId as string;
    const userIdSeed = parseInt(rawUserId) || 0;
    const finalSeed = userIdSeed + parseInt(id);

    if (exam.shuffleQuestions) {
      seededShuffle(allQuestions, finalSeed);
    }

    // Acak jawaban di dalam setiap soal jika diaktifkan (Konsisten per User)
    if (exam.shuffleAnswers) {
      allQuestions.forEach((q: any) => {
        if (q.answers && q.answers.length > 0) {
          // SORT FIRST FOR DETEMINISM
          const sortedAnswers = [...q.answers].sort((a, b) => a.id - b.id);
          q.answers = seededShuffle(sortedAnswers, finalSeed + q.id);
        }
      });
    }

    res.json(allQuestions);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

app.get('/api/exams/:id', async (req, res) => {
  if (!prisma) return res.status(500).json({});
  const { id } = req.params;
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: parseInt(id) }
    });
    res.json(exam);
  } catch (e) {
    res.status(500).json({});
  }
});

// Helper: Calculate Score for a Result
async function calculateScoreForExamResult(resultId: number) {
    if (!prisma) return 0;
    
    // 1. Fetch result with exam rules
    const result = await prisma.examResult.findUnique({
      where: { id: resultId },
      include: { exam: true }
    });

    if (!result || !result.answersJson) return 0;

    const answers = JSON.parse(result.answersJson);
    const examId = result.examId;

    // 2. Get subject rules for this exam
    const rules = await prisma.testTopicRule.findMany({
      where: { examId: examId }
    });
    const subjectIds = rules.map(r => r.subjectId);

    // 3. Get all questions in those subjects (MUST ORDER ANSWERS BY ID)
    const questions = await prisma.question.findMany({
        where: { subjectId: { in: subjectIds } },
        include: { 
          answers: { orderBy: { id: 'asc' } } 
        }
    });

    let totalScore = 0;
    const basePoints = result.exam.basePoints || 1;
    const wrongPoints = result.exam.wrongPoints || 0;

    const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    // --- REPLICATE SEEDED SHUFFLE LOGIC ---
    const seededRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };

    const seededShuffle = (array: any[], seedBase: number) => {
        let m = array.length, t, i;
        let seed = seedBase;
        while (m) {
            i = Math.floor(seededRandom(seed++) * m--);
            t = array[m];
            array[m] = array[i];
            array[i] = t;
        }
        return array;
    };

    const userIdSeed = Number(result.userId) || 0;
    const finalSeed = userIdSeed + Number(examId);

    questions.forEach(q => {
        const studentAns = answers[q.id.toString()];
        if (!studentAns) return;

        // Shuffle internal answers to match student's view
        // 1. MUST SORT BY ID FIRST TO BE DETERMINISTIC
        const displayAnswers = [...q.answers].sort((a, b) => a.id - b.id);
        
        if (result.exam.shuffleAnswers) {
            seededShuffle(displayAnswers, finalSeed + Number(q.id));
        }

        const type = (q.type || '').toUpperCase();

        if (type === 'MCSA' || type === 'MULTIPLE-CHOICE' || type === 'MULTIPLE_CHOICE' || type === 'MCSA') {
            const correctAns = displayAnswers.find(a => a.isRight);
            const correctPos = correctAns ? labels[displayAnswers.indexOf(correctAns)] : null;
            
            if (correctPos === studentAns) {
                totalScore += basePoints;
            } else if (studentAns !== null && studentAns !== '') {
                totalScore += wrongPoints;
            }
        } else if (type === 'ESSAY') {
            // Manual grade from GradingManager
            if (studentAns && typeof studentAns.manualScore === 'number') {
                totalScore += studentAns.manualScore;
            }
        } else if (type === 'MCMA' || type === 'mcma') {
            const correctAnsArray = displayAnswers.filter(a => a.isRight);
            const correctPositions = correctAnsArray.map(a => labels[displayAnswers.indexOf(a)]);
            
            const isCorrect = Array.isArray(studentAns) && 
                            studentAns.length === correctPositions.length && 
                            studentAns.every(val => correctPositions.includes(val));
                            
            if (isCorrect) {
                totalScore += basePoints;
            } else {
                totalScore -= wrongPoints;
            }
        } else if (type === 'ORDERING' || type === 'MATCHING') {
            // studentAns is an object: {"A": "1", "B": "2"}
            if (typeof studentAns === 'object' && !Array.isArray(studentAns)) {
                let correctInQuestion = 0;
                displayAnswers.forEach((ans, idx) => {
                    const label = labels[idx];
                    const studentVal = studentAns[label];
                    // Compare student choice with expected position (DB is 0-indexed, UI is 1-indexed)
                    if (studentVal && studentVal.toString() === (ans.position + 1).toString()) {
                        correctInQuestion++;
                    }
                });

                if (displayAnswers.length > 0) {
                    const partialScore = (correctInQuestion / displayAnswers.length) * basePoints;
                    totalScore += partialScore;
                }
            }
        }
    });

    // 4. Update the score in DB
    await prisma.examResult.update({
        where: { id: resultId },
        data: { score: totalScore }
    });

    return totalScore;
}

const startLocks = new Set<string>();

// Start or Resume Exam
app.post('/api/exams/:id/start', async (req, res) => {
  if (!prisma) return res.status(500).json({ success: false });
  const { id } = req.params;
  const { userId } = req.body;

  const lockKey = `${userId}-${id}`;
  if (startLocks.has(lockKey)) {
    return res.status(429).json({ success: false, error: 'Proses sedang berjalan, silakan tunggu...' });
  }

  try {
    startLocks.add(lockKey);
    // Safety release after 10s in case of catastrophic failure
    setTimeout(() => startLocks.delete(lockKey), 10000);
    
    // Check if result already exists and is not finished
    let result = await prisma.examResult.findFirst({
      where: { 
        examId: parseInt(id), 
        userId: parseInt(userId),
        status: { in: ['ONGOING', 'SUSPENDED'] }
      },
      orderBy: { startedAt: 'desc' }
    });

    if (result) {
      const exam = await prisma.exam.findUnique({ where: { id: parseInt(id) } });
      const durationSec = (exam?.duration || 60) * 60;
      
      let remainingSec = 0;
      if (result.remainingSeconds !== null && result.remainingSeconds !== undefined) {
          remainingSec = result.remainingSeconds;
      } else {
          const elapsedSec = Math.floor((Date.now() - new Date(result.startedAt).getTime()) / 1000);
          remainingSec = Math.max(0, durationSec - elapsedSec);
      }

      return res.json({ 
        success: true, 
        resultId: result.id, 
        answers: JSON.parse(result.answersJson || '{}'),
        remainingSeconds: remainingSec
      });
    }

    // Checking if there is a COMPLETED one to see if we can repeat
    const completedResult = await prisma.examResult.findFirst({
        where: { examId: parseInt(id), userId: parseInt(userId), status: 'COMPLETED' },
        orderBy: { startedAt: 'desc' }
    });

    if (completedResult) {
        const exam = await prisma.exam.findUnique({ where: { id: parseInt(id) } });
        if (!exam?.canRepeat) {
            return res.status(403).json({ success: false, error: 'Anda sudah menyelesaikan ujian ini dan tidak dapat mengulanginya.' });
        }
    }

    // Create new ONLY if no ongoing session found
    result = await prisma.examResult.create({
        data: { examId: parseInt(id), userId: parseInt(userId), status: 'ONGOING', answersJson: '{}' }
    });

    res.json({ 
        success: true, 
        resultId: result.id, 
        answers: JSON.parse(result.answersJson || '{}'),
        remainingSeconds: (exam?.duration || 60) * 60
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Gagal memulai sesi ujian' });
  } finally {
    startLocks.delete(lockKey); // AKSI WAJIB: Gembok pasti terlepas di sini
  }
});

// Save Progress (Auto-save)
app.post('/api/exams/:id/save-progress', async (req, res) => {
    if (!prisma) return res.status(500).json({ success: false });
    const { id } = req.params;
    const { userId, answers, timeLeft } = req.body;
    
    try {
        const result = await prisma.examResult.findFirst({
            where: { examId: parseInt(id), userId: parseInt(userId) },
            orderBy: { startedAt: 'desc' }
        });
        
        if (!result) return res.status(404).json({ success: false, error: 'Sesi tidak ditemukan' });
        
        console.log(`[SAVE] User: ${userId}, Time: ${timeLeft}s, Status: ${result.status}`);

        // Update regardless of status to ensure time is saved if they are suspended
        const updated = await prisma.examResult.update({
            where: { id: result.id },
            data: { 
                answersJson: JSON.stringify(answers || {}),
                remainingSeconds: timeLeft !== undefined ? Number(timeLeft) : undefined
            }
        });

        res.json({ success: true, status: updated.status });
    } catch (e) {
        console.error("[SAVE ERROR]", e);
        res.status(500).json({ success: false });
    }
});

// Submit Exam (Grading)
app.post('/api/exams/:id/submit', async (req, res) => {
    if (!prisma) return res.status(500).json({ success: false });
    const { id } = req.params;
    let { userId, answers } = req.body;

    try {
        const exam = await prisma.exam.findUnique({
            where: { id: parseInt(id) }
        });
        if (!exam) return res.status(404).json({ success: false });

        const result = await prisma.examResult.findFirst({
            where: { examId: parseInt(id), userId: parseInt(userId), status: 'ONGOING' },
            orderBy: { startedAt: 'desc' }
        });
        if (!result) return res.status(404).json({ success: false, error: 'Sesi tidak ditemukan atau sudah selesai' });
        
        // Fallback to database answers if not provided in body
        if (!answers || Object.keys(answers).length === 0) {
            answers = JSON.parse(result.answersJson || '{}');
        }

        if (!answers || Object.keys(answers).length === 0) {
            return res.status(400).json({ success: false, error: 'Tidak ada jawaban yang dikirim atau tersimpan.' });
        }

        // CALCULATE SCORE
        // 1. Get all questions that WERE part of this exam (based on rules)
        // Note: For simplicity, we'll fetch all questions for the subjects involved in topic rules
        // In a real production app, we should store exactly which questions were given to the user.
        const allQuestions = await prisma.question.findMany({
            where: { 
                subjectId: { 
                    in: (await prisma.testTopicRule.findMany({ where: { examId: parseInt(id) } })).map(r => r.subjectId) 
                } 
            },
            include: { answers: true }
        });

        let totalScore = 0;
        let answeredQuestionsCount = 0;
        const totalPossibleQuestions = Object.keys(answers).length; // Or use rule total

        for (const qIdStr in answers) {
            const qId = parseInt(qIdStr);
            const userAnswer = answers[qId];
            const originalQ = allQuestions.find(q => q.id === qId);
            
            if (!originalQ) continue;
            answeredQuestionsCount++;

            if (originalQ.type === 'MCSA') {
                const rightAnswer = originalQ.answers.find(a => a.isRight);
                if (rightAnswer && String(userAnswer) === String(rightAnswer.id)) {
                    totalScore += exam.basePoints;
                } else if (userAnswer) {
                    totalScore -= exam.wrongPoints;
                }
            } else if (originalQ.type === 'MCMA') {
                // Simplified multi-answer logic: must match exactly or partial scoring
                const rightIds = originalQ.answers.filter(a => a.isRight).map(a => String(a.id)).sort();
                const userIds = Array.isArray(userAnswer) ? userAnswer.map(a => String(a)).sort() : [];
                if (JSON.stringify(rightIds) === JSON.stringify(userIds)) {
                    totalScore += exam.basePoints;
                }
            }
            // ESSAY and others can't be auto-graded easily here without more complexity
        }

        // Final percentage score
        const finalScore = (totalScore / (answeredQuestionsCount || 1)) * 100;

        await prisma.examResult.update({
            where: { id: result.id },
            data: {
                score: Math.max(0, finalScore),
                answersJson: JSON.stringify(answers),
                status: 'COMPLETED',
                finishedAt: new Date()
            }
        });

        res.json({ success: true, score: finalScore });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Gagal mengirim jawaban' });
    }
});

// ===== INSTALLATION WIZARD =====
app.get('/api/install/status', (req, res) => {
  const isInstalled = !!process.env.DATABASE_URL;
  res.json({ installed: isInstalled });
});

// ===== SETTINGS MANAGEMENT =====
app.get('/api/settings', async (req, res) => {
  if (!prisma) return res.json({});
  try {
    let rawSettings: any[] = [];
    try {
      // Try standard way
      rawSettings = await prisma.appSetting.findMany();
    } catch (e) {
      // Fallback to raw query if model is missing from client
      rawSettings = await prisma.$queryRaw`SELECT \`key\`, \`value\` FROM app_settings`;
    }

    const config: any = {};
    rawSettings.forEach((s: any) => {
      try {
        config[s.key] = JSON.parse(s.value);
      } catch (e) {
        config[s.key] = s.value;
      }
    });

    // Provide DEFAULTS if missing
    if (!config.cbt_test_settings) {
      config.cbt_test_settings = {
        realtimeGrading: true,
        simpleCheatDetection: true,
        cheatLockWaitTime: '60',
        cheatMaxViolations: '3',
        forceFullscreen: true,
        forceLogoutAndLock: true
      };
    }
    if (!config.cbt_site_settings) config.cbt_site_settings = { siteName: "CBT Modern" };

    res.json(config);
  } catch (err) {
    res.status(500).json({});
  }
});

app.post('/api/settings', async (req, res) => {
  if (!prisma) return res.status(500).json({ success: false });
  const settings = req.body;
  try {
    for (const key in settings) {
      const valStr = JSON.stringify(settings[key]);
      try {
        // Try standard way
        await prisma.appSetting.upsert({
          where: { key },
          update: { value: valStr },
          create: { key, value: valStr }
        });
      } catch (e) {
        // Fallback to raw query for upsert
        await prisma.$executeRaw`INSERT INTO app_settings (\`key\`, \`value\`) VALUES (${key}, ${valStr}) ON DUPLICATE KEY UPDATE \`value\` = ${valStr}`;
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.post('/api/install/setup-db', async (req, res) => {
  const { host, port, user, password, dbname } = req.body;
  if (!host || !port || !user || !dbname) {
    return res.status(400).json({ success: false, error: 'Semua field (kecuali password) harus diisi' });
  }

  const dbPassword = password || '';
  const dbUrl = `mysql://${user}:${dbPassword}@${host}:${port}/${dbname}`;
  const envPath = path.resolve(process.cwd(), '.env');
  
  try {
    fs.writeFileSync(envPath, `DATABASE_URL="${dbUrl}"\n`);
    process.env.DATABASE_URL = dbUrl;
    dotenv.config({ override: true });

    exec('npx prisma db push --skip-generate', { cwd: process.cwd(), env: { ...process.env, DATABASE_URL: dbUrl } }, (error, stdout, stderr) => {
      if (error) {
        console.error('Migration error:', stderr);
        if (fs.existsSync(envPath)) fs.unlinkSync(envPath);
        process.env.DATABASE_URL = '';
        return res.status(500).json({ success: false, error: 'Gagal membuat database/tabel. Periksa kredensial Anda.\n' + stderr });
      }
      
      prisma = new PrismaClient();
      res.json({ success: true, message: 'Database berhasil dikonfigurasi.' });
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/install/setup-admin', async (req, res) => {
  const { username, password, fullName } = req.body;
  if (!prisma) return res.status(500).json({ success: false, error: 'Database belum terhubung' });
  try {
    const user = await prisma.user.create({
      data: { username, password, fullName, level: 'ADMIN', levelInt: 10 }
    });
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Gagal membuat admin: ' + err.message });
  }
});

app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/install')) return next();
  if (!process.env.DATABASE_URL || !prisma) {
    return res.status(503).json({ success: false, error: 'Aplikasi belum diinstall/dikonfigurasi.' });
  }
  next();
});
// ===== END INSTALLATION WIZARD =====

// API to save imported questions
app.post('/api/import-questions', async (req, res) => {
  const { moduleName, topicName, questions } = req.body;

  try {
    // 1. Get or Create Module
    let module = await prisma.module.findUnique({
      where: { name: moduleName }
    });

    if (!module) {
      module = await prisma.module.create({
        data: { name: moduleName }
      });
    }

    // 2. Get or Create Subject (Topic)
    let subject = await prisma.subject.findFirst({
      where: { 
        name: topicName,
        moduleId: module.id
      }
    });

    if (!subject) {
      subject = await prisma.subject.create({
        data: { 
          name: topicName,
          moduleId: module.id
        }
      });
    }

    // 3. Create Questions and Answers Sequentially to preserve order/ID sequence
    const createdQuestions = [];
    for (const q of questions) {
      const created = await prisma.question.create({
        data: {
          subjectId: subject!.id,
          content: q.question,
          type: q.type,
          difficulty: q.difficulty,
          answers: {
            create: q.options.map((opt: any, index: number) => ({
              content: opt.text,
              isRight: q.answer.includes(String.fromCharCode(65 + index)),
              weight: opt.perc || (q.answer.includes(String.fromCharCode(65 + index)) ? 100 : 0),
              position: index
            }))
          }
        }
      });
      createdQuestions.push(created);
    }

    res.json({ 
      success: true, 
      message: `${createdQuestions.length} soal berhasil diimpor ke ${moduleName} > ${topicName}`,
      moduleId: module.id,
      subjectId: subject.id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Gagal menyimpan data ke database' });
  }
});

// API to get modules and topics
app.get('/api/modules', async (req, res) => {
  try {
    const modules = await prisma.module.findMany({
      include: {
        subjects: {
          include: {
            _count: { select: { questions: true } }
          }
        }
      }
    });
    res.json(modules);
  } catch (err) {
    res.status(500).json([]);
  }
});

// API to get questions for a topic (Sorted by ID)
app.get('/api/questions/:subjectId', async (req, res) => {
  const { subjectId } = req.params;
  try {
    const questions = await prisma.question.findMany({
      where: { subjectId: parseInt(subjectId) },
      include: { answers: true },
      orderBy: { id: 'asc' }
    });
    res.json(questions);
  } catch (err) {
    res.status(500).json([]);
  }
});

// DELETE Module
app.delete('/api/modules/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.module.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: 'Modul berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal menghapus modul. Mungkin masih ada topik di dalamnya.' });
  }
});

// DELETE Subject (Topic)
app.delete('/api/subjects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.subject.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: 'Topik berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal menghapus topik.' });
  }
});

// UPDATE Question
app.put('/api/questions/:id', async (req, res) => {
  const { id } = req.params;
  const { content, type, difficulty, answers } = req.body;

  try {
    // 1. Update basic question info
    const updatedQuestion = await prisma.question.update({
      where: { id: parseInt(id) },
      data: {
        content,
        type,
        difficulty: parseInt(difficulty),
      }
    });

    // 2. Refresh answers (Delete existing and create new)
    // This ensures answers are exactly as provided in the edit form
    await prisma.answer.deleteMany({
      where: { questionId: parseInt(id) }
    });

    await prisma.answer.createMany({
      data: answers.map((ans: any, idx: number) => ({
        questionId: parseInt(id),
        content: ans.content,
        isRight: ans.isRight,
        weight: ans.weight || (ans.isRight ? 100 : 0),
        position: idx
      }))
    });

    res.json({ success: true, message: 'Soal berhasil diperbarui' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Gagal memperbarui soal' });
  }
});

// CREATE New Question (Manual Input)
app.post('/api/questions', async (req, res) => {
  const { content, type, difficulty, subjectId, answers } = req.body;
  try {
    const question = await prisma.question.create({
      data: {
        subjectId: parseInt(subjectId),
        content,
        type,
        difficulty: parseInt(difficulty),
        answers: {
          create: answers.map((ans: any, idx: number) => ({
            content: ans.content,
            isRight: ans.isRight,
            weight: ans.weight || (ans.isRight ? 100 : 0),
            position: idx
          }))
        }
      },
      include: { answers: true }
    });
    res.json({ success: true, question });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Gagal membuat soal baru' });
  }
});

// QUICK SET Answer Key
app.patch('/api/questions/:id/quick-set-answer', async (req, res) => {
  const { id } = req.params;
  const { answerId } = req.body;
  try {
    const qId = parseInt(id);
    const aId = parseInt(answerId);

    await prisma.$transaction([
      // 1. Reset all answers for this question to false
      prisma.answer.updateMany({
        where: { questionId: qId },
        data: { isRight: false, weight: 0 }
      }),
      // 2. Set the chosen one to true
      prisma.answer.update({
        where: { id: aId },
        data: { isRight: true, weight: 100 }
      })
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Gagal update kunci jawaban' });
  }
});

// QUICK TOGGLE Answer (For MCMA - Multiple answers)
app.patch('/api/questions/:id/quick-toggle-answer', async (req, res) => {
  const { answerId } = req.body;
  try {
    const aId = parseInt(answerId);
    
    // 1. Get current status
    const current = await prisma.answer.findUnique({ where: { id: aId } });
    if (!current) return res.status(404).json({ success: false });

    // 2. Toggle
    const newStatus = !current.isRight;
    await prisma.answer.update({
      where: { id: aId },
      data: { isRight: newStatus, weight: newStatus ? 100 : 0 }
    });

    // 3. AUTO-SWITCH Question Type based on answer count
    const qId = current.questionId;
    const allAnswers = await prisma.answer.findMany({ where: { questionId: qId } });
    const rightCount = allAnswers.filter(a => a.isRight).length;

    if (rightCount > 1) {
      await prisma.question.update({ where: { id: qId }, data: { type: 'MCMA' } });
    } else if (rightCount === 1) {
      await prisma.question.update({ where: { id: qId }, data: { type: 'MCSA' } });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Gagal toggle kunci jawaban' });
  }
});

// BULK IMPORT Users
app.post('/api/users/bulk-import', async (req, res) => {
  const { users } = req.body;
  try {
    const results = await Promise.all(
      users.map(async (u: any) => {
        // 1. Get or Create Group
        let group = null;
        if (u.grup) {
          group = await prisma.group.upsert({
            where: { name: u.grup },
            update: {},
            create: { name: u.grup }
          });
        }

        // 2. Map Level
        let level: any = 'STUDENT';
        let lv = parseInt(u.level_user);
        
        if (isNaN(lv)) {
            const lvlStr = String(u.level_user).toLowerCase();
            if (lvlStr.includes('admin')) { lv = 10; level = 'ADMIN'; }
            else if (lvlStr.includes('proctor') || lvlStr.includes('proktor')) { lv = 7; level = 'PROCTOR'; }
            else if (lvlStr.includes('guru') || lvlStr.includes('teacher')) { lv = 5; level = 'TEACHER'; }
            else { lv = 1; level = 'STUDENT'; }
        } else {
            if (lv >= 10) level = 'ADMIN';
            else if (lv >= 7) level = 'PROCTOR';
            else if (lv >= 5) level = 'TEACHER';
            else { lv = 1; level = 'STUDENT'; }
        }

        // 3. Create User (Skip if username exists)
        return prisma.user.upsert({
          where: { username: u.username },
          update: {
            fullName: u.nama,
            password: u.password,
            level: level,
            levelInt: lv,
            groupId: group?.id,
            notes: u.keterangan
          },
          create: {
            username: u.username,
            password: u.password,
            fullName: u.nama,
            level: level,
            levelInt: lv,
            groupId: group?.id,
            notes: u.keterangan || ''
          }
        });
      })
    );
    res.json({ success: true, count: results.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Gagal impor pengguna' });
  }
});

// GET All Groups with user counts
app.get('/api/groups', async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      include: {
        _count: { select: { users: true } }
      }
    });
    res.json(groups);
  } catch (err) {
    res.status(500).json([]);
  }
});

// CREATE Group
app.post('/api/groups', async (req, res) => {
  const { name } = req.body;
  try {
    const group = await prisma.group.create({ data: { name } });
    res.json({ success: true, group });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal membuat grup' });
  }
});

// DELETE Group
app.delete('/api/groups/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.group.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal hapus grup. Pastikan tidak ada user di dalamnya.' });
  }
});

// GET All Users with group info
app.get('/api/users', async (req, res) => {
  const { groupId } = req.query;
  try {
    const users = await prisma.user.findMany({
      where: groupId ? { groupId: parseInt(groupId as string) } : {},
      include: { group: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json([]);
  }
});

// GET all results with filters
app.get('/api/results', async (req, res) => {
  if (!prisma) return res.status(500).json([]);
  const { examId, groupId, dateStart, dateEnd } = req.query;

  try {
    const where: any = {};
    if (examId) where.examId = parseInt(examId as string);
    if (groupId) where.user = { groupId: parseInt(groupId as string) };
    
    if (dateStart || dateEnd) {
      where.startedAt = {};
      if (dateStart) where.startedAt.gte = new Date(dateStart as string);
      if (dateEnd) where.startedAt.lte = new Date(dateEnd as string);
    }

    const results = await prisma.examResult.findMany({
      where,
      include: {
        user: {
          include: { group: true }
        },
        exam: true
      },
      orderBy: { startedAt: 'desc' }
    });

    // Format for frontend
    const formatted = results.map((r: any) => {
      let durationStr = '--:--';
      if (r.startedAt && r.finishedAt) {
        const diff = Math.floor((r.finishedAt.getTime() - r.startedAt.getTime()) / 1000);
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        durationStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      } else if (r.status === 'ONGOING') {
        durationStr = 'Ongoing';
      }

      const formatDate = (d: Date) => {
        return d.toISOString().replace('T', ' ').substring(0, 19);
      };

      return {
        id: r.id,
        startTime: r.startedAt ? formatDate(r.startedAt) : '--',
        duration: durationStr,
        testName: r.exam?.name || 'Unknown',
        username: r.user?.username || 'Unknown',
        fullName: r.user?.fullName || 'Unknown',
        groups: r.user?.group ? [r.user.group.name] : ['Default'],
        points: r.score, 
        score: Math.round(r.score), 
        status: r.status // Return raw status: ONGOING, COMPLETED, SUSPENDED
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

// REGRADE Result
app.post('/api/results/:id/regrade', async (req, res) => {
  if (!prisma) return res.status(500).json({ success: false });
  const { id } = req.params;
  const resultId = parseInt(id);

  if (isNaN(resultId)) {
    return res.status(400).json({ success: false, error: 'ID tidak valid' });
  }

  try {
    const newScore = await calculateScoreForExamResult(resultId);
    res.json({ success: true, newScore });
  } catch (err) {
    console.error("REGRADE_ERROR:", err);
    res.status(500).json({ success: false, error: 'Gagal mengupdate penilaian' });
  }
});

// ACTION on Exam Result (Lock, Unlock, Add Time)
app.post('/api/results/:id/action', async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  if (!prisma) return res.status(500).json({ success: false });

  try {
    const resultId = parseInt(id);
    const result = await prisma.examResult.findUnique({
        where: { id: resultId }
    });

    if (!result) return res.status(404).json({ success: false, error: 'Hasil tidak ditemukan' });

    if (action === 'lock') {
        // Suspend the result and KILL session
        await prisma.session.deleteMany({ where: { userId: result.userId } });
        await prisma.examResult.update({
            where: { id: resultId },
            data: { status: 'SUSPENDED' }
        });
    } else if (action === 'unlock') {
        // Resume result
        await prisma.examResult.update({
            where: { id: resultId },
            data: { status: 'ONGOING' }
        });
    } else if (action === 'add_time_5') {
        // Add 300 seconds (5 min)
        const currentSecs = result.remainingSeconds !== null ? result.remainingSeconds : (await prisma.exam.findUnique({where:{id:result.examId}}))?.duration * 60 || 3600;
        await prisma.examResult.update({
            where: { id: resultId },
            data: { remainingSeconds: currentSecs + 300 }
        });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// DELETE Exam Result
// GET Result Review
app.get('/api/results/:id/review', async (req, res) => {
  const { id } = req.params;
  console.log(`[DEBUG] RAW ID: "${id}"`);
  const resultId = parseInt(id);
  
  if (isNaN(resultId)) {
    return res.status(400).json({ success: false, error: 'ID tidak valid' });
  }

  console.log(`[DEBUG] Mengambil review untuk ID: ${resultId}`);
  try {
    const result = await prisma.examResult.findUnique({
      where: { id: resultId },
      include: {
        user: { include: { group: true } },
        exam: {
          include: {
            topicRules: { include: { subject: true } }
          }
        }
      }
    });

    if (!result) return res.status(404).json({ success: false, error: 'Hasil pengerjaan tidak ditemukan' });

    const answers = (result.answersJson as any) || {};
    const rules = await prisma.testTopicRule.findMany({
      where: { examId: result.examId }
    });
    const subjectIds = rules.map(r => r.subjectId);

    const questions = await prisma.question.findMany({
        where: { subjectId: { in: subjectIds } },
        include: { 
          answers: { orderBy: { id: 'asc' } } 
        }
    });

    const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    // --- REPLICATE SEEDED SHUFFLE LOGIC ---
    const seededRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };

    const seededShuffle = (array: any[], seedBase: number) => {
        let m = array.length, t, i;
        let seed = seedBase;
        while (m) {
            i = Math.floor(seededRandom(seed++) * m--);
            t = array[m];
            array[m] = array[i];
            array[i] = t;
        }
        return array;
    };

    const userIdSeed = Number(result.userId) || 0;
    const finalSeed = userIdSeed + Number(result.examId);

    const reviewQuestions = questions.map(q => {
        const studentAns = typeof answers === 'string' ? JSON.parse(answers)[q.id] : answers[q.id];
        
        // --- CRITICAL FIX: SORT BY ID FIRST ---
        const displayAnswers = [...q.answers].sort((a, b) => a.id - b.id);
        
        // Shuffle to match student's view
        if (result.exam.shuffleAnswers) {
            seededShuffle(displayAnswers, finalSeed + Number(q.id));
        }

        let isCorrect = false;
        let points = 0;
        const basePoints = result.exam.basePoints || 1;
        const wrongPoints = result.exam.wrongPoints || 0;

        const type = (q.type || '').toUpperCase();

        if (type === 'MCSA' || type === 'MULTIPLE-CHOICE' || type === 'MULTIPLE_CHOICE') {
            const correctAns = displayAnswers.find(a => a.isRight);
            const correctPos = correctAns ? labels[displayAnswers.indexOf(correctAns)] : null;
            isCorrect = studentAns === correctPos;
            points = isCorrect ? basePoints : (studentAns ? -wrongPoints : 0);
        } else if (type === 'MCMA' || type === 'mcma') {
            const correctAnsArray = displayAnswers.filter(a => a.isRight);
            const correctPositions = correctAnsArray.map(a => labels[displayAnswers.indexOf(a)]);
            isCorrect = Array.isArray(studentAns) && 
                      studentAns.length === correctPositions.length && 
                      studentAns.every(val => correctPositions.includes(val));
            points = isCorrect ? basePoints : (studentAns && studentAns.length > 0 ? -wrongPoints : 0);
        } else if (type === 'ORDERING' || type === 'MATCHING') {
            if (studentAns && typeof studentAns === 'object' && !Array.isArray(studentAns)) {
                let correctInQuestion = 0;
                displayAnswers.forEach((ans, idx) => {
                    const label = labels[idx];
                    const studentVal = studentAns[label];
                    if (studentVal && studentVal.toString() === (ans.position + 1).toString()) {
                        correctInQuestion++;
                    }
                });
                
                points = (correctInQuestion / displayAnswers.length) * basePoints;
                isCorrect = correctInQuestion === displayAnswers.length;
            }
        }

        const correctAns = displayAnswers.find(a => a.isRight);
        
        return {
            id: q.id,
            type: type.toLowerCase() === 'mcma' ? 'mcma' : (type.toLowerCase() === 'ordering' ? 'ordering' : (type.toLowerCase() === 'matching' ? 'matching' : 'multiple-choice')),
            question: q.content,
            options: displayAnswers.map((a, idx) => ({ 
                key: labels[idx], 
                text: a.content, 
                correctVal: (a.position + 1).toString()
            })),
            studentChoice: studentAns,
            correctChoice: correctAns ? labels[displayAnswers.indexOf(correctAns)] : null,
            correctChoices: type.toLowerCase() === 'mcma' ? displayAnswers.filter(a => a.isRight).map(a => labels[displayAnswers.indexOf(a)]) : null,
            isCorrect,
            points: points.toFixed(2)
        };
    });

    const formatDate = (d: Date) => d.toISOString().replace('T', ' ').substring(0, 19);

    res.json({
        info: {
            name: result.user?.fullName || 'Unknown',
            username: result.user?.username || 'Unknown',
            testName: result.exam?.name || 'Unknown',
            date: result.startedAt ? result.startedAt.toLocaleDateString('id-ID') : '--',
            startTime: result.startedAt ? formatDate(result.startedAt) : '--',
            endTime: result.finishedAt ? formatDate(result.finishedAt) : '--',
            duration: result.finishedAt && result.startedAt ? Math.floor((result.finishedAt.getTime() - result.startedAt.getTime()) / 60000) + ' Menit' : '--',
            points: result.score.toFixed(2),
            correct: reviewQuestions.filter(q => q.isCorrect).length + ' / ' + questions.length,
            wrong: reviewQuestions.filter(q => !q.isCorrect).length + ' / ' + questions.length,
            unanswered: (questions.length - Object.keys(answers).length) + ' / ' + questions.length,
            comment: '-'
        },
        reviews: reviewQuestions
    });

  } catch (err: any) {
    console.error("REVIEW_API_ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/exams/:id/attendance', async (req, res) => {
  const { id } = req.params;
  const { groupId } = req.query;

  try {
    // 1. Get Exam with its groups
    const exam = await prisma.exam.findUnique({
      where: { id: parseInt(id) },
      include: { groups: true }
    });

    if (!exam) return res.status(404).json({ error: 'Ujian tidak ditemukan' });

    // 2. Identify target Group IDs
    let targetGroupIds: number[] = [];
    if (groupId) {
        targetGroupIds = [parseInt(groupId as string)];
    } else {
        targetGroupIds = exam.groups.map(g => g.id);
    }

    // 3. Get All Students in those Groups
    const allStudents = await prisma.user.findMany({
      where: { 
        groupId: { in: targetGroupIds },
        level: 'STUDENT'
      },
      include: { group: true }
    });

    // 4. Get Existing Results for this Exam
    const results = await prisma.examResult.findMany({
      where: { examId: parseInt(id) },
      select: { userId: true, status: true }
    });

    const presentUserIds = new Set(results.map(r => r.userId));

    // 5. Separate Present and Absent
    const presentStudents = allStudents.filter(s => presentUserIds.has(s.id));
    const absentStudents = allStudents.filter(s => !presentUserIds.has(s.id));

    const total = allStudents.length;
    const presentCount = presentStudents.length;
    const absentCount = absentStudents.length;
    const presentPercentage = total > 0 ? ((presentCount / total) * 100).toFixed(1) + '%' : '0%';
    const absentPercentage = total > 0 ? ((absentCount / total) * 100).toFixed(1) + '%' : '0%';

    res.json({
      examName: exam.name,
      totalStudents: total,
      presentCount: presentCount,
      absentCount: absentCount,
      presentPercentage,
      absentPercentage,
      absentStudents: absentStudents.map(s => ({
        id: s.id,
        username: s.username,
        name: s.fullName,
        group: s.group?.name || '--'
      }))
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/attendance/recap', async (req, res) => {
  if (!prisma) return res.status(500).json({ error: 'Database context not found' });
  const { examIds, groupId } = req.query;

  if (!examIds) return res.status(400).json({ error: 'Parameter examIds wajib diisi' });
  const ids = (examIds as string).split(',').map(id => parseInt(id));

  try {
    // 1. Get all selected exams
    const exams = await prisma.exam.findMany({
      where: { id: { in: ids } },
      include: { groups: true },
      orderBy: { startTime: 'asc' }
    });

    if (exams.length === 0) return res.status(404).json({ error: 'Ujian tidak ditemukan' });

    // 2. Identify target groups and unique students
    let targetGroupIds: number[] = [];
    if (groupId) {
        targetGroupIds = [parseInt(groupId as string)];
    } else {
        const groupSet = new Set<number>();
        exams.forEach(e => e.groups.forEach(g => groupSet.add(g.id)));
        targetGroupIds = Array.from(groupSet);
    }

    const students = await prisma.user.findMany({
      where: { 
        groupId: { in: targetGroupIds },
        level: 'STUDENT'
      },
      include: { group: true },
      orderBy: { fullName: 'asc' }
    });

    // 3. Get all results for these exams
    const allResults = await prisma.examResult.findMany({
      where: { examId: { in: ids } },
      select: { userId: true, examId: true, status: true }
    });

    // 4. Build lookup map: Map<userId, Map<examId, status>>
    const resultMap = new Map<number, Set<number>>();
    allResults.forEach(r => {
        if (!resultMap.has(r.userId)) resultMap.set(r.userId, new Set());
        resultMap.get(r.userId)?.add(r.examId);
    });

    // 5. Format Data for the Matrix
    const matrix = students.map(s => {
        const attendance: Record<number, boolean> = {};
        let missedCount = 0;
        
        exams.forEach(e => {
            const wasPresent = resultMap.get(s.id)?.has(e.id) || false;
            attendance[e.id] = wasPresent;
            if (!wasPresent) missedCount++;
        });

        return {
            id: s.id,
            name: s.fullName,
            username: s.username,
            group: s.group?.name || '--',
            attendance,
            missedCount
        };
    });

    res.json({
        exams: exams.map(e => ({ id: e.id, name: e.name, date: e.startTime })),
        matrix,
        totalStudents: students.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menghasilkan rekap' });
  }
});

app.delete('/api/results/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.examResult.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal menghapus hasil' });
  }
});

// CREATE User
app.post('/api/users', async (req, res) => {
  try {
    const data = req.body;
    let levelInt = parseInt(data.levelInt || '1');
    let level: any = 'STUDENT';
    
    if (levelInt >= 10) level = 'ADMIN';
    else if (levelInt >= 7) level = 'PROCTOR';
    else if (levelInt >= 5) level = 'TEACHER';
    
    const user = await prisma.user.create({
      data: {
        username: data.username,
        password: data.password || '123456',
        fullName: data.fullName,
        level: level,
        levelInt: levelInt,
        groupId: data.groupId ? parseInt(data.groupId) : null,
      }
    });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal tambah user' });
  }
});

// UPDATE User
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const data = req.body;
    const updateData: any = {};
    
    if (data.username !== undefined) updateData.username = data.username;
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.password !== undefined && data.password !== '') updateData.password = data.password;
    
    if (data.levelInt !== undefined) {
      const levelInt = parseInt(data.levelInt);
      updateData.levelInt = levelInt;
      if (levelInt >= 10) updateData.level = 'ADMIN';
      else if (levelInt >= 7) updateData.level = 'PROCTOR';
      else if (levelInt >= 5) updateData.level = 'TEACHER';
      else updateData.level = 'STUDENT';
    }

    if (data.groupId !== undefined) {
      updateData.groupId = data.groupId ? parseInt(data.groupId) : null;
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal update user' });
  }
});

// DELETE User
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal hapus user' });
  }
});

// === EXAMS API ===

// Get all subjects
app.get('/api/subjects', async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: { 
        module: true,
        _count: {
          select: { questions: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(subjects);
  } catch (error) {
    res.status(500).json([]);
  }
});


// List Exams
app.get('/api/exams', async (req, res) => {
  try {
    const exams = await prisma.exam.findMany({
      include: { 
        groups: true,
        topicRules: { include: { subject: true } }
      },
      orderBy: { startTime: 'desc' }
    });
    res.json(exams);
  } catch (error) {
    res.status(500).json([]);
  }
});

// Create Exam
app.post('/api/exams', async (req, res) => {
  const data = req.body;
  const { topicRules, allowedGroupIds, ...examData } = data;

  try {
    const newExam = await prisma.exam.create({
      data: {
        ...examData,
        startTime: new Date(examData.startTime),
        endTime: new Date(examData.endTime),
        groups: {
          connect: (allowedGroupIds || []).map((id: number) => ({ id }))
        },
        topicRules: {
          create: topicRules.map((r: any) => ({
            subjectId: parseInt(r.subjectId),
            questionCount: parseInt(r.questionCount),
            questionType: r.questionType || 'all',
            difficulty: r.difficulty || 1,
            answerCount: r.answerCount || 4
          }))
        }
      }
    });
    res.json({ success: true, exam: newExam });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Gagal membuat tes baru' });
  }
});

// Update Exam
app.put('/api/exams/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const { topicRules, allowedGroupIds, ...examData } = data;

  try {
    const updatedExam = await prisma.$transaction(async (tx) => {
      // 1. Update main exam data & groups
      const exam = await tx.exam.update({
        where: { id: parseInt(id) },
        data: {
          ...examData,
          startTime: new Date(examData.startTime),
          endTime: new Date(examData.endTime),
          groups: {
            set: (allowedGroupIds || []).map((id: number) => ({ id }))
          }
        }
      });

      // 2. Clear old topic rules
      await tx.testTopicRule.deleteMany({
        where: { examId: parseInt(id) }
      });

      // 3. Insert new topic rules
      await tx.testTopicRule.createMany({
        data: topicRules.map((r: any) => ({
          examId: parseInt(id),
          subjectId: parseInt(r.subjectId),
          questionCount: parseInt(r.questionCount),
          questionType: r.questionType || 'all',
          difficulty: r.difficulty || 1,
          answerCount: r.answerCount || 4
        }))
      });

      return exam;
    });

    res.json({ success: true, exam: updatedExam });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Gagal memperbarui tes' });
  }
});

// DELETE Exam
app.delete('/api/exams/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.exam.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal menghapus tes' });
  }
});


// ===== ITEM ANALYSIS API =====
// ===== ITEM ANALYSIS API =====
app.get('/api/analysis/exams/:examId', async (req, res) => {
    const { examId } = req.params;
    try {
        const exam = await prisma.exam.findUnique({
            where: { id: parseInt(examId) },
            include: {
                topicRules: true,
                results: {
                    where: { status: 'COMPLETED' }
                }
            }
        });

        if (!exam || exam.results.length === 0) {
            return res.status(404).json({ error: 'Ujian atau hasil tidak ditemukan/belum ada yang selesai' });
        }

        // 1. Get all questions involved in this exam
        const subjectIds = exam.topicRules.map(r => r.subjectId);
        const questions = await prisma.question.findMany({
            where: { subjectId: { in: subjectIds } },
            include: { answers: true }
        });

        const totalStudents = exam.results.length;
        const sortedResults = [...exam.results].sort((a, b) => b.score - a.score);
        const groupSize = Math.max(1, Math.round(totalStudents * 0.27));
        const upperGroup = sortedResults.slice(0, groupSize);
        const lowerGroup = sortedResults.slice(-groupSize);

        // Pre-parse answers for all students
        const resultsWithParsedAnswers = exam.results.map(r => ({
            ...r,
            answers: JSON.parse(r.answersJson || '{}')
        }));

        const analysis = questions.map(q => {
            // Check if this question was actually answered by anyone
            const answersToQ = resultsWithParsedAnswers.filter(r => r.answers[q.id] !== undefined);
            if (answersToQ.length === 0) return null;

            const correctOption = q.answers.find(a => a.isRight);
            const correctCount = answersToQ.filter(r => String(r.answers[q.id]) === String(correctOption?.id)).length;
            
            const diffIdx = correctCount / totalStudents;
            let diffLabel = 'SEDANG';
            if (diffIdx < 0.3) diffLabel = 'SUKAR';
            if (diffIdx > 0.7) diffLabel = 'MUDAH';

            const uCorrect = upperGroup.filter(r => {
                const ans = JSON.parse(r.answersJson || '{}');
                return String(ans[q.id]) === String(correctOption?.id);
            }).length;
            const lCorrect = lowerGroup.filter(r => {
                const ans = JSON.parse(r.answersJson || '{}');
                return String(ans[q.id]) === String(correctOption?.id);
            }).length;
            
            const discIdx = (uCorrect / groupSize) - (lCorrect / groupSize);
            
            let discLabel = 'CUKUP';
            if (discIdx >= 0.4) discLabel = 'BAIK (DITERIMA)';
            else if (discIdx >= 0.3) discLabel = 'CUKUP (DIPERBAIKI)';
            else if (discIdx >= 0.2) discLabel = 'JELEK (DIPERBAIKI)';
            else discLabel = 'SANGAT JELEK (DIBUANG)';

            const opts = q.answers.map(o => ({
                label: o.id.toString(), // Simplified label if needed, or use position
                count: resultsWithParsedAnswers.filter(r => String(r.answers[q.id]) === String(o.id)).length,
                isKey: o.isRight
            }));

            // Attempt to use A, B, C... labels if possible
            const alphaLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
            const optsWithLabels = opts.map((o, i) => ({ ...o, label: alphaLabels[i] || (i+1).toString() }));

            return { id: q.id, content: q.content, diffIdx: diffIdx.toFixed(2), diffLabel, discIdx: discIdx.toFixed(2), discLabel, opts: optsWithLabels };
        }).filter(item => item !== null);

        res.json({ examTitle: exam.name, totalStudents, analysis });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database Error: Gagal menghitung statistik' });
    }
});

// ===== BACKUP & RESTORE SYSTEM =====
const BACKUP_DIR = path.join(process.cwd(), 'backups');
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

// Use absolute path for MySQL bin (Laragon specific)
const MYSQL_BIN = 'C:/laragon/bin/mysql/mysql-8.0.30-winx64/bin/';
const MYSQL_DUMP_EXE = `"${MYSQL_BIN}mysqldump.exe"`;
const MYSQL_EXE = `"${MYSQL_BIN}mysql.exe"`;

// Helper to get DB info from connection string
const getDbConfig = () => {
    const url = process.env.DATABASE_URL || '';
    // Format: mysql://user:password@host:port/database
    const regex = /mysql:\/\/([^:]+):?(.*)@([^:]+):(\d+)\/(.+)/;
    const match = url.match(regex);
    if (!match) return null;
    return {
        user: match[1],
        pass: match[2],
        host: match[3],
        port: match[4],
        db: match[5]
    };
};

// 1. List Backups
app.get('/api/backups', (req, res) => {
    try {
        const files = fs.readdirSync(BACKUP_DIR);
        const backups = files.filter(f => f.endsWith('.sql')).map((f, i) => {
            const stats = fs.statSync(path.join(BACKUP_DIR, f));
            return {
                id: i + 1,
                filename: f,
                type: 'database',
                size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
                createdAt: stats.birthtime.toLocaleString('sv-SE').replace('T', ' '),
                status: 'success'
            };
        });
        res.json(backups);
    } catch (err) {
        res.status(500).json({ error: 'Gagal membaca riwayat backup' });
    }
});

// 2. Create Backup (Handles Database or Full)
app.post('/api/backups', (req, res) => {
    const { type } = req.body;
    const config = getDbConfig();
    if (!config) return res.status(500).json({ error: 'Format DATABASE_URL tidak valid' });

    const now = new Date();
    const ts = now.toISOString().replace(/[:T]/g, '-').split('.')[0];
    const sqlTempName = `db_temp_${ts}.sql`;
    const sqlTempPath = path.join(process.cwd(), sqlTempName);

    const passPart = config.pass ? `-p${config.pass}` : '';
    const dumpCmd = `${MYSQL_DUMP_EXE} -u ${config.user} ${passPart} -h ${config.host} --port=${config.port} ${config.db} > "${sqlTempPath}"`;

    exec(dumpCmd, (error, stdout, stderr) => {
        if (error) {
            console.error('Dump Error:', stderr);
            if (fs.existsSync(sqlTempPath)) fs.unlinkSync(sqlTempPath);
            return res.status(500).json({ error: 'Gagal menjalankan mysqldump' });
        }

        if (type === 'full') {
            const zipFilename = `backup_full_${ts}.zip`;
            const zipPath = path.join(BACKUP_DIR, zipFilename);
            
            // Simplest way: tar from CWD
            const zipCmd = `tar -a -cf "backups/${zipFilename}" "${sqlTempName}" uploads public`;

            exec(zipCmd, (zError, zStdout, zStderr) => {
                // Cleanup temp SQL in root
                if (fs.existsSync(sqlTempPath)) fs.unlinkSync(sqlTempPath);
                
                if (zError) {
                    console.error('Zip Error:', zStderr);
                    return res.status(500).json({ error: 'Gagal membuat archive zip' });
                }
                res.json({ success: true, filename: zipFilename });
            });
        } else {
            const finalSql = path.join(BACKUP_DIR, `backup_db_${ts}.sql`);
            if (fs.existsSync(sqlTempPath)) {
                fs.renameSync(sqlTempPath, finalSql);
            }
            res.json({ success: true, filename: `backup_db_${ts}.sql` });
        }
    });
});

// 3. Download Backup
app.get('/api/backups/download/:filename', (req, res) => {
    const { filename } = req.params;
    const filepath = path.join(BACKUP_DIR, filename);
    if (fs.existsSync(filepath)) {
        res.download(filepath);
    } else {
        res.status(404).json({ error: 'File tidak ditemukan' });
    }
});

// 4. Delete Backup
app.delete('/api/backups/:filename', (req, res) => {
    const { filename } = req.params;
    const filepath = path.join(BACKUP_DIR, filename);
    try {
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Gagal menghapus file' });
    }
});

// 5. Restore Backup (Handles .sql or .zip)
app.post('/api/backups/restore', upload.single('backupFile'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Tidak ada file diunggah' });

    const config = getDbConfig();
    if (!config) return res.status(500).json({ error: 'Format DATABASE_URL tidak valid' });

    const originalFilepath = req.file.path;
    const isZip = req.file.originalname.endsWith('.zip');
    let sqlFileToRestore = originalFilepath;
    let tempExtractDir = '';

    const performRestore = (sqlPath: string) => {
        const passPart = config.pass ? `-p${config.pass}` : '';
        const cmd = `${MYSQL_EXE} -u ${config.user} ${passPart} -h ${config.host} --port=${config.port} ${config.db} < "${sqlPath}"`;

        exec(cmd, (error, stdout, stderr) => {
            // Final Cleanup
            try {
                if (fs.existsSync(originalFilepath)) fs.unlinkSync(originalFilepath);
                if (tempExtractDir && fs.existsSync(tempExtractDir)) {
                    fs.rmSync(tempExtractDir, { recursive: true, force: true });
                }
            } catch (e) {}

            if (error) {
                console.error('Restore Error:', stderr);
                return res.status(500).json({ error: 'Gagal menjalankan restore database. Pastikan file SQL valid.' });
            }
            res.json({ success: true });
        });
    };

    if (isZip) {
        // If ZIP, extract the SQL file first
        tempExtractDir = path.join(process.cwd(), 'uploads', 'temp_restore_' + Date.now());
        if (!fs.existsSync(tempExtractDir)) fs.mkdirSync(tempExtractDir);

        const extractCmd = `tar -xf "${originalFilepath}" -C "${tempExtractDir}"`;
        exec(extractCmd, (eErr) => {
            if (eErr) {
                return res.status(500).json({ error: 'Gagal mengekstrak file ZIP' });
            }
            // Find the SQL file inside the extracted folder
            const files = fs.readdirSync(tempExtractDir);
            const sqlFile = files.find(f => f.endsWith('.sql'));
            if (!sqlFile) {
                return res.status(400).json({ error: 'Tidak ditemukan file database (.sql) di dalam ZIP' });
            }
            performRestore(path.join(tempExtractDir, sqlFile));
        });
    } else {
        performRestore(originalFilepath);
    }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ SERVER ONLINE: Running on port ${PORT}`);
});
